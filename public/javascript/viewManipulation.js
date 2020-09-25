let disappearElements = document.getElementsByClassName('disappear');
for (let i = 0; i < disappearElements.length; i++) {
  setTimeout(() => {
    disappearElements[i].parentNode.removeChild(disappearElements[i]);
  }, 3000);
}