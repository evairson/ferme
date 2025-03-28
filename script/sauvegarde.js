async function getCurrentFileSha({GITHUB_USERNAME, REPO, FILE_PATH, TOKEN}) {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/${FILE_PATH}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${TOKEN}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  }

export async function createToast({file}) {
  const editor = new toastui.Editor({
    el: document.querySelector('#editor'),
    height: '500px',
    initialEditType: 'wysiwyg',
    previewStyle: 'vertical',
    hooks: {
        addImageBlobHook: (blob, callback) => {
            image_list.push(blob);
            console.log(blob);
            callback(URL.createObjectURL(blob), blob.name);
        }
    },
  });
  fetch(file)
      .then(response => response.text())
      .then(html => {
          const start = html.indexOf('<main class="prose">') ;
          const end = html.indexOf('</main>');
          const content = html.substring(start, end);
          editor.setHTML(content);
          console.log(content);
      });
  return editor;
}

export async function uploadImageToGitHub({ file, TOKEN }) {
    const GITHUB_USERNAME = "evairson";
    const REPO = "ferme";
    const BRANCH = "main";
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/images/importer/${Date.now()}.png`;

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: "Upload image from Quill editor",
        content: base64,
        branch: BRANCH,
      })
    });
    return res;
  }

export async function publishToGitHub({ file, html, TOKEN }) {
    const GITHUB_USERNAME = "evairson";
    const REPO = "ferme";
    const BRANCH = "main";
    const fullHTML = `<!DOCTYPE html>
    <html>
    <body> 
        <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../style.css">
    <title>Document</title>
    </head>
       <header> 
        <a href="../index.html">
            <img class="w-20" src="../images/logo.png" alt="Logo de la Ferme">
        </a>
        <h1 class="text-3xl ml-20">La Ferme</h1>
        <i class="font-extralight ml-20 text-sm">4 chemin de Bignolas, La Marolle-en-Sologne</i>
    </header>
    <main class="prose">
    ${html}
    </main>
    </body>
    </html>`;



    const contentEncoded = btoa(unescape(encodeURIComponent(fullHTML)));
    const sha = await getCurrentFileSha({GITHUB_USERNAME, REPO, FILE_PATH: file, TOKEN});

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO}/contents/${file}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: "Mise à jour depuis l'éditeur Quill",
        content: contentEncoded,
        branch: BRANCH,
        ...(sha && { sha })
      })
    });
      return res.ok;
    }

export async function uploadImagesToGitHub({ image_list, TOKEN }) {
  for (let i = 0; i < image_list.length; i++) {
    await uploadImageToGitHub({
        file: image_list[i],
        TOKEN : TOKEN})
    .then((response) => {
        const imageUrl = response.url;
        const realName = imageUrl.split('/')[imageUrl.split('/').length - 1];
        console.log("Image URL:", imageUrl);
        console.log("Image name:", realName);
        console.log("Image uploaded successfully:", imageUrl);

        const img = document.querySelector(`img[alt="${image_list[i].name}"]`);
            if (img) {
            img.src = `https://evairson.github.io/ferme/images/importer/${realName}`;
            console.log("Image updated in the editor:", img.src);
            } else if (img === null) {
                console.error("Image not found in the editor:", image_list[i].name);
                throw new Error("Image not found in the editor");
            } else {
                console.error("Image not found in the editor:", image_list[i].name);
                throw new Error("Image not found in the editor");
            }
            
        
    })
    .catch((error) => {
        console.error("Error uploading image:", error);
        document.getElementById('status').textContent = "❌ Échec de la publication.";
        throw error;
    });
    }
}