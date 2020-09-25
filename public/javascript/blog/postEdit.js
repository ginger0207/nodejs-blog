Quill.register("modules/imageUploader", ImageUploader);

// let Font = Quill.import("formats/font");
let Font = Quill.import("attributors/style/font");
let fonts = ["Arial", "Roboto", "Times-New-Roman", "Noto-Sans-TC", "Noto-Serif-TC"];
// Font.whitelist = fonts;
delete Font.whitelist;
Quill.register(Font, true);

var quill = new Quill("#editor", {
  modules: {
    imageResize: {
      displaySize: true,
    },
    imageDrop: true,
    imageUploader: {
      upload: (file) => {
        return imageUpload(file);
      },
    },
    toolbar: [
      ["bold", "italic", "underline", "strike"], // toggled buttons
      ["blockquote", "code-block"],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["link", "image"],

      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }], // superscript/subscript

      [{ color: [] }, { background: [] }], // dropdown with defaults from theme
      [{ font: fonts }],

      ["clean"], // remove formatting button
    ],
  },
  placeholder: "add some text...",
  theme: "snow",
});

quill.root.innerHTML = post.content;

function imageUpload(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    // console.log(file);
    formData.append("image", file);

    const XHR = new XMLHttpRequest();
    XHR.open("POST", `/${post.author}/blog/image`);
    // XHR.setRequestHeader("Content-type", "multipart/form-data");
    XHR.onload = function () {
      // console.log("upload finished");
      // console.log("XHR.response: ", XHR.response);

      let { image } = JSON.parse(XHR.response);
      resolve(image);
    };
    XHR.onerror = function () {
      // console.log(XHR.response);
      reject("Upload failed");
    };

    XHR.send(formData);
  });
}

let submitPost = document.querySelector("#postForm");
let content = document.querySelector("#hidden_input");
submitPost.onsubmit = function () {
  if (quill.root.textContent.length === 0) {
    alert("content can not be empty!");
    return false;
  }

  content.value = quill.root.innerHTML;
};

let newTagBtn = document.querySelector("#newTagBtn");
let tagSelect = document.querySelector("#tag_select");
let newTag = document.querySelector("#newTag");
let label = document.querySelector('label[for="tag_select"]');
newTagBtn.onclick = function () {
  tagSelect.style.display =
    tagSelect.style.display === "block" ? "none" : "block";
  newTag.style.display = newTag.style.display === "none" ? "block" : "none";
  newTag.required = !newTag.required;
  document.querySelector("#newTag").value = "";
  let btnText = '<i class="fas fa-plus mr-1"></i>New tag';
  newTagBtn.innerHTML = newTagBtn.innerHTML === btnText ? "Cancel" : btnText;
  label.innerText =
    label.innerText === "Choose a tag:" ? "Create a tag:" : "Choose a tag:";
  newTagBtn.classList.toggle("btn-primary");
  newTagBtn.classList.toggle("btn-secondary");
};
