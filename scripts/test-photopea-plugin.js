import { exec } from "child_process";

const PORT = 1234;
exec(`npx vite --port ${PORT}`);

const url = `https://www.photopea.com#${encodeURIComponent(JSON.stringify({
    environment: {
        plugins: [
            {
                name: "Color Theater",
                url: `http://localhost:${PORT}/?portal=photopea`,
                icon: "https://lunalgraphics.com/colortheater/icon.png",
            }
        ]
    }
}))}`;

console.log(url);

const start = process.platform === 'darwin' ? 'open' : 
              process.platform === 'win32' ? 'start' : 'xdg-open';

exec(`${start} ${url}`);