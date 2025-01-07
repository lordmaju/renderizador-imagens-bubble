require('dotenv').config();  // Carrega as variáveis do .env

const puppeteer = require('puppeteer'); // Para capturar páginas
const express = require('express'); // Para criar o servidor
const app = express();

// A chave secreta agora vem do ambiente de execução (variáveis de ambiente)
const SECRET_KEY = process.env.SECRET_KEY;  // Lê a chave de SECRET_KEY no ambiente

if (!SECRET_KEY) {
    console.error("Erro: A chave secreta não foi configurada no ambiente!");
    process.exit(1);  // Encerra o processo se a chave não estiver configurada
}

// Permite receber JSON no body da requisição
app.use(express.json());

// Middleware para verificar a chave de autenticação
app.use((req, res, next) => {
    const userKey = req.headers['authorization'];

    // Log para verificar a chave enviada
    console.log("Chave enviada na requisição:", userKey);

    if (!userKey || userKey !== `Bearer ${SECRET_KEY}`) {
        console.error("Chave de autenticação inválida!");
        return res.status(403).json({ error: 'Acesso negado. Chave de autenticação inválida.' });
    }

    // Log para confirmar que a chave foi validada corretamente
    console.log("Chave de autenticação validada com sucesso!");
    
    next();  // Se a chave for válida, continua a requisição
});

// Endpoint para renderizar e capturar o elemento específico
app.post('/render', async (req, res) => {
    const { url } = req.body;

    // Log para verificar a URL recebida
    console.log("URL recebida:", url);

    if (!url) {
        console.error("Erro: URL não fornecida!");
        return res.status(400).json({ error: 'URL é necessária!' });
    }

    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();

        // Log para indicar que o navegador foi iniciado
        console.log("Navegador iniciado, definindo a viewport...");

        await page.setViewport({ width: 1500, height: 1500 });
        await page.goto(url, { waitUntil: 'networkidle0' });

        const elementSelector = '#templete';  // Altere isso para o seletor correto do elemento
        await page.waitForSelector(elementSelector);

        // Log para indicar que o elemento foi encontrado
        console.log(`Aguardando o elemento ${elementSelector}...`);

        // Ajusta o tamanho do elemento para 1500x1500 pixels
        await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.width = '1500px';
                element.style.height = '1500px';
            }
        }, elementSelector);

        // Captura a imagem do elemento especificado
        const element = await page.$(elementSelector);
        const screenshot = await element.screenshot({ type: 'png', encoding: 'base64' });

        await browser.close();

        // Log para indicar que a captura foi feita
        console.log("Captura do elemento realizada com sucesso!");

        // Retorna a imagem em base64
        res.json({ image: `data:image/png;base64,${screenshot}` });  // Retorna a imagem em base64
    } catch (error) {
        console.error("Erro durante a renderização:", error);
        res.status(500).json({ error: 'Erro ao renderizar o elemento.' });
    }
});

// Configura a porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
