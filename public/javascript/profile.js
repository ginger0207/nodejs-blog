var quill = new Quill("#editor", {
  modules: {
    toolbar: [
      ["bold", "italic"],
      ["link", "blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
    ],
  },
  placeholder: "introduce yourself...",
  theme: "snow",
});

let about_form = document.getElementById("aboutMe");
about_form.onsubmit = function () {
  const XHR = new XMLHttpRequest();
  let about = quill.root.innerHTML;
  // console.log(JSON.stringify({ about: about }));
  // alert("");

  XHR.open("PUT", `/${blogOwner}/profile/about`);
  XHR.setRequestHeader("Content-type", "application/json; charset=utf-8");

  XHR.onload = function () {
    // console.log(typeof XHR.response);
    aboutMeDisplay.innerHTML = JSON.parse(XHR.response).about;
    editProfileBtn.click();
  };

  XHR.send(JSON.stringify({ about: about }));
  // let about = document.querySelector("input[name=aboutMe]");
  // about.val = JSON.stringify(quill.getContents());
  // console.log("submitted", $(form).serialize(), $(form).serializeArray());
  return false;
};

let avatarForm = document.getElementById("avatar");
let image = document.getElementById("imageFile");
avatarForm.onsubmit = function () {
  if (image.files.length === 0) return false;

  const XHR = new XMLHttpRequest();
  let data = new FormData();
  data.append("avatar", image.files[0]);

  XHR.open("PUT", `/${blogOwner}/profile/avatar`);
  // XHR.setRequestHeader("Content-type", "multipart/form-data");

  XHR.onload = function () {
    // console.log("upload finished");
    // console.log("secure_url: ", XHR.responseText);
    let img = document.querySelector("#avatarDisplay img");
    img.src = JSON.parse(XHR.response).avatar;
    editProfileBtn.click();
  };

  XHR.send(data);
  return false;
};

let editProfileBtn = document.getElementById("EditBtn");
let editForm = document.getElementById("aboutMe");
let aboutMeDisplay = document.getElementById("aboutMeDisplay");
let avatarDisplay = document.getElementById("avatarDisplay");
if (editProfileBtn) {
  editProfileBtn.addEventListener("click", function () {
    editForm.style.display =
      editForm.style.display === "none" ? "block" : "none";
    aboutMeDisplay.style.display =
      aboutMeDisplay.style.display === "block" ? "none" : "block";

    avatarForm.style.display =
      avatarForm.style.display === "none" ? "block" : "none";
    avatarDisplay.style.display =
      avatarDisplay.style.display === "block" ? "none" : "block";

    editProfileBtn.innerText =
      editProfileBtn.innerText === "Edit Profile" ? "Cancel" : "Edit Profile";
    editProfileBtn.classList.toggle("btn-primary");
    editProfileBtn.classList.toggle("btn-secondary");
  });
}
