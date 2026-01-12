const asyncHandler = require('express-async-handler');
const Scan = require('../models/Scan');
const User = require('../models/User');
const Disease = require('../models/Disease');

// @desc    Upload plant image & Get Analysis Result
// @route   POST /api/scans
// @access  Private
const uploadScan = asyncHandler(async (req, res) => {
  // 1. Validation: Check if a file is uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  // ---------------------------------------------------------
  // TODO: Future Integration with Python AI Service
  // const formData = new FormData();
  // formData.append('file', fs.createReadStream(req.file.path));
  // const response = await axios.post('http://localhost:5000/predict', formData...);
  // ---------------------------------------------------------

  // 2. MOCK AI RESULT (SIMULATION)
  // هذه القائمة تختار عشوائياً مرض من الأمراض الجديدة لتجربة الداتا بيز
  const possibleDiseases = [
    'Apple_Scab', 
    'Strawberry_Leaf_Scorch', 
    'Corn_Common_Rust', 
    'Grape_Black_Rot',
    'Potato_Late_Blight',
    'Tomato_Yellow_Leaf_Curl_Virus'
  ];
  
  const randomDisease = possibleDiseases[Math.floor(Math.random() * possibleDiseases.length)];

  // محاكاة رد الذكاء الاصطناعي
  const aiResult = {
    disease: randomDisease, // هيختار اسم عشوائي من اللي فوق
    confidence: (Math.random() * (99 - 80) + 80).toFixed(2) // نسبة ثقة عشوائية بين 80% و 99%
  };

  const { disease, confidence } = aiResult;

  // 3. Fetch Disease Info from Database (The Look-up Step)
  const diseaseInfo = await Disease.findOne({ name: disease });

  // 4. Prepare Data for History (Snapshot)
  // Default values in case disease is not found in DB
  let treatmentText = "Consult an agricultural expert.";
  let symptomsText = "Information not available.";
  let preventionText = "No prevention data available.";

  // If found, fill with real data from DB
  if (diseaseInfo) {
    treatmentText = diseaseInfo.treatment;
    symptomsText = diseaseInfo.symptoms;
    preventionText = diseaseInfo.prevention || "N/A"; // Handle prevention
  }

  // 5. Create Scan Record (Save to History)
  const scan = await Scan.create({
    user: req.user.id,
    imageUrl: req.file.path,   // Path from Multer
    result: disease,           // Disease Name
    confidence: confidence,
    treatment: treatmentText,  // Snapshot of treatment
    symptoms: symptomsText,    // Snapshot of symptoms
    prevention: preventionText // Snapshot of prevention (NEW)
  });

  // 6. Return Final Response
  res.status(200).json(scan);
});

// @desc    Get current user's scan history
// @route   GET /api/scans
// @access  Private
const getMyScans = asyncHandler(async (req, res) => {
  // Fetch scans for logged-in user, sorted by newest first
  const scans = await Scan.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(scans);
});

module.exports = {
  uploadScan,
  getMyScans,
};