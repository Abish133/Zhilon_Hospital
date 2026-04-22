const validateDoctor = (req, res, next) => {
  const { name, specialization, email } = req.body;
  
  if (!name || !specialization || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name, specialization, and email are required fields'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  next();
};

module.exports = { validateDoctor };