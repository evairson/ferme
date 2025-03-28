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
    <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
    <link rel="stylesheet" href="../style.css">
    <title>Document</title>
    </head>
       <header class="p-3 bg-green-950 text-white pl-20 py-5"> 
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
