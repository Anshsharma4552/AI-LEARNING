import Quiz from "../models/Quiz.js";

export const getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({
      userId: req.user._id,
      documentId: req.params.documentId,
    })
      .populate("documentId", "title fileName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("documentId", "title fileName");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const { userAnswers } = req.body;

    if (!Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        error: "Please provide userAnswers array",
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
      });
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Quiz has no questions",
      });
    }

    let correctCount = 0;

    const formattedAnswers = quiz.questions.map((question, index) => {
      const selectedAnswer = userAnswers[index];
      const isCorrect = selectedAnswer === question.correctAnswer;

      if (isCorrect) correctCount++;

      return {
        questionIndex: index,
        selectedAnswer,
        isCorrect,
        answeredAt: new Date(),
      };
    });

    quiz.userAnswers = formattedAnswers;
    quiz.score = correctCount;
    quiz.completedAt = new Date();

    await quiz.save();

    res.status(200).json({
      success: true,
      data: quiz,
      message: "Quiz submitted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("documentId", "title fileName");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
      });
    }

    if (!quiz.completedAt) {
      return res.status(400).json({
        success: false,
        error: "Quiz not completed yet",
      });
    }

    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: "Quiz not found",
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};