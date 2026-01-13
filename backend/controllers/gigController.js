const Gig = require('../models/Gig');
const Bid = require('../models/Bid');
const { GIG_STATUS } = require('../constants');

/**
 * Get all gigs with search and filtering
 * @route GET /api/gigs
 * @access Public
 */
const getGigs = async (req, res) => {
  try {
    const { 
      search, category, minBudget, maxBudget, skills,
      sortBy, sortOrder, page, limit, clientId, deadline, status
    } = req.query;

    // Build filter object
    let filter = { status: status || GIG_STATUS.OPEN };

    // Text search in title and description
    if (search?.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Category filter
    if (category?.trim()) {
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // Budget range filter
    if (minBudget || maxBudget) {
      filter.$and = filter.$and || [];
      
      if (minBudget) {
        const minBudgetNum = parseInt(minBudget);
        if (!isNaN(minBudgetNum)) {
          filter.$and.push({ 'budget.max': { $gte: minBudgetNum } });
        }
      }
      
      if (maxBudget) {
        const maxBudgetNum = parseInt(maxBudget);
        if (!isNaN(maxBudgetNum)) {
          filter.$and.push({ 'budget.min': { $lte: maxBudgetNum } });
        }
      }
    }

    // Skills filter
    if (skills?.trim()) {
      const skillsArray = skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      if (skillsArray.length > 0) {
        filter.skills = { 
          $in: skillsArray.map(skill => new RegExp(skill, 'i'))
        };
      }
    }

    // Client filter
    if (clientId?.trim()) {
      filter.client = clientId.trim();
    }

    // Deadline filter
    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (!isNaN(deadlineDate.getTime())) {
        filter.deadline = { $gte: deadlineDate };
      }
    }

    // Build sort object
    const validSortFields = ['createdAt', 'budget.min', 'budget.max', 'deadline', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [gigs, totalCount] = await Promise.all([
      Gig.find(filter)
        .populate('client', 'name email')
        .populate({
          path: 'selectedBid',
          populate: { path: 'freelancer', select: 'name email' }
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Gig.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Add computed fields to each gig
    const enrichedGigs = gigs.map(gig => ({
      ...gig,
      budgetRange: `${gig.budget.min} - ${gig.budget.max}`,
      daysUntilDeadline: Math.ceil((new Date(gig.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
      isUrgent: new Date(gig.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      skillsCount: gig.skills.length
    }));

    res.json({
      success: true,
      data: {
        gigs: enrichedGigs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        },
        filters: {
          search: search || null,
          category: category || null,
          minBudget: minBudget ? parseInt(minBudget) : null,
          maxBudget: maxBudget ? parseInt(maxBudget) : null,
          skills: skills ? skills.split(',').map(s => s.trim()) : null,
          sortBy: sortField,
          sortOrder: sortOrder || 'desc'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching gigs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single gig by ID
 * @route GET /api/gigs/:id
 * @access Public
 */
const getGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('client', 'name email profile');

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    res.json({ success: true, gig });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching gig'
    });
  }
};

/**
 * Create new gig
 * @route POST /api/gigs
 * @access Private (Client only)
 */
const createGig = async (req, res) => {
  try {
    const { title, description, category, budget, deadline, skills } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!category) missingFields.push('category');
    if (!budget) missingFields.push('budget');
    if (!deadline) missingFields.push('deadline');
    if (!skills) missingFields.push('skills');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate budget structure
    if (!budget || typeof budget !== 'object' || !budget.min || !budget.max) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be an object with min and max properties',
        example: { budget: { min: 100, max: 500 } }
      });
    }

    if (typeof budget.min !== 'number' || typeof budget.max !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Budget min and max must be numbers',
        received: { min: typeof budget.min, max: typeof budget.max }
      });
    }

    if (budget.min > budget.max || budget.min < 0 || budget.max < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid budget range',
        received: budget
      });
    }

    // Validate deadline
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be a valid future date'
      });
    }

    // Validate skills
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skills must be a non-empty array'
      });
    }

    const invalidSkills = skills.filter(skill => !skill || typeof skill !== 'string' || skill.trim().length === 0);
    if (invalidSkills.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All skills must be non-empty strings'
      });
    }

    // Validate string lengths
    if (title.trim().length < 5 || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 5 and 100 characters'
      });
    }

    if (description.trim().length < 20 || description.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Description must be between 20 and 2000 characters'
      });
    }

    const gig = await Gig.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      budget: {
        min: Number(budget.min),
        max: Number(budget.max)
      },
      deadline: deadlineDate,
      skills: skills.map(skill => skill.trim()).filter(skill => skill.length > 0),
      client: req.user.id
    });

    const populatedGig = await Gig.findById(gig._id)
      .populate('client', 'name email');

    res.status(201).json({
      success: true,
      message: 'Gig created successfully',
      gig: populatedGig
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Database validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating gig',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user's posted gigs
 * @route GET /api/gigs/my/posted
 * @access Private (Client only)
 */
const getMyPostedGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ client: req.user.id })
      .populate('selectedBid')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: gigs.length,
      gigs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your gigs'
    });
  }
};

/**
 * Update gig
 * @route PUT /api/gigs/:id
 * @access Private (Client only - own gigs)
 */
const updateGig = async (req, res) => {
  try {
    let gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this gig'
      });
    }

    if (gig.status !== GIG_STATUS.OPEN) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update gig that is not open'
      });
    }

    // Validate budget if provided
    if (req.body.budget && req.body.budget.min > req.body.budget.max) {
      return res.status(400).json({
        success: false,
        message: 'Minimum budget cannot be greater than maximum budget'
      });
    }

    gig = await Gig.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('client', 'name email');

    res.json({
      success: true,
      message: 'Gig updated successfully',
      gig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating gig'
    });
  }
};

/**
 * Delete gig
 * @route DELETE /api/gigs/:id
 * @access Private (Client only - own gigs)
 */
const deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({
        success: false,
        message: 'Gig not found'
      });
    }

    if (gig.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this gig'
      });
    }

    if (gig.status === GIG_STATUS.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete gig that is in progress'
      });
    }

    await Gig.findByIdAndDelete(req.params.id);
    await Bid.deleteMany({ gig: req.params.id });

    res.json({
      success: true,
      message: 'Gig deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while deleting gig'
    });
  }
};

module.exports = {
  getGigs,
  getGig,
  createGig,
  getMyPostedGigs,
  updateGig,
  deleteGig
};