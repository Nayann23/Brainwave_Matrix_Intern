const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Post", postSchema);
