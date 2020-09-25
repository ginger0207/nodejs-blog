let commentEditBtn = document.getElementById("commentEditBtn");
let commentEditForm = document.getElementById("commentEditForm");
let cancelBtn = document.getElementById("cancelBtn");
let commentDeleteBtn = document.getElementById("commentDeleteBtn");

if (commentEditBtn) {
  commentEditBtn.addEventListener("click", (event) => {
    commentEditForm.style.display =
      commentEditForm.style.display === "none" ? "block" : "none";
    commentEditBtn.style.display = "none";
    commentDeleteBtn.style.display = "none";
  });
}

if (commentEditForm) {
  commentEditForm.addEventListener("submit", (event) => {
    commentEditForm.style.display =
      commentEditForm.style.display === "none" ? "block" : "none";
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", (event) => {
    commentEditForm.style.display = "none";
    commentEditBtn.style.display = "block";
    commentDeleteBtn.style.display = "block";
  });
}
