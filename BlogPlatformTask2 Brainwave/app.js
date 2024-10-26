const express = require("express");
const app = express();
const path = require("path");
const userModel = require("./models/user");
const postModel = require("./models/post");
const commentModel = require("./models/comments");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Middleware for Authentication
function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  jwt.verify(token, "shhhh", (err, decoded) => {
    if (err) return res.redirect("/login");
    req.user = decoded;
    next();
  });
}

// Profile Route
app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    // Fetch only the current user's posts
    let user = await userModel
      .findOne({ email: req.user.email })
      .populate({
        path: "posts",
        populate: {
          path: "comments",
          populate: {
            path: "user",
            select: "username" // Only selecting the username field
          }
        }
      });

    res.render("profile", { user });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));

// Register Route
app.post("/register", async (req, res) => {
  const { name, username, password, email, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User Already Registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      user = await userModel.create({ username, name, age, email, password: hash });
      const token = jwt.sign({ email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.send("Registered");
    });
  });
});

// Login Route
app.post("/login", async (req, res) => {
  const { password, email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) return res.status(401).send("Invalid email or password");

  bcrypt.compare(password, user.password, (err, result) => {
    if (err) return res.status(500).send("Server error");
    if (result) {
      const token = jwt.sign({ email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else {
      res.redirect("/login");
    }
  });
});

// Logout Route
app.get("/logout", (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.redirect("/login");
});

// Post Creation Route
app.post("/post", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  const { content } = req.body;
  
  // Create the post and associate it with the user
  const post = await postModel.create({ user: user._id, content });
  user.posts.push(post._id);
  await user.save();
  
  res.redirect("/profile");
});

// Like Route
app.get("/like/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.id);
  const userIndex = post.likes.indexOf(req.user.userid);
  userIndex === -1 ? post.likes.push(req.user.userid) : post.likes.splice(userIndex, 1);
  await post.save();
  res.redirect("/profile");
});

// Edit Route
app.get("/edit/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.id).populate("user");
  const user = await userModel.findOne({ email: req.user.email });
  res.render("edit", { post, user });
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  await postModel.findByIdAndUpdate(req.params.id, { content: req.body.content });
  res.redirect("/profile");
});

// Comment Route
app.post("/post/:postId/comment", isLoggedIn, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.userid;

  try {
    const newComment = await commentModel.create({ content, user: userId, post: postId });
    await postModel.findByIdAndUpdate(postId, { $push: { comments: newComment._id } });
    res.redirect("/profile"); // Redirect to the profile page to view the updated post
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Delete Comment Route
app.post('/comment/:id/delete', isLoggedIn, async (req, res) => {
  console.log(`Deleting comment with ID: ${req.params.id}`); // Debug log
  try {
    const commentId = req.params.id;

    // Delete the comment
    await commentModel.findByIdAndDelete(commentId);

    // Redirect to the profile page after deletion
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting comment');
  }
});


app.post('/post/:id/delete', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.id;

    // Find the post and check if the logged-in user is the owner
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Ensure the post belongs to the logged-in user
    if (post.user.toString() !== req.user.userid) {
      return res.status(403).send("You are not authorized to delete this post");
    }

    // Delete the post
    await postModel.findByIdAndDelete(postId);

    // Remove the post reference from the user's posts array
    const user = await userModel.findById(req.user.userid);
    user.posts.pull(postId);
    await user.save();

    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting post');
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
