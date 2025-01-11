const puppeteer = require('puppeteer'); // Para capturar páginas
const express = require('express'); // Para criar o servidor
const app = express();

// Permite receber JSON no body da requisição
app.use(express.json());

// Endpoint para renderizar e capturar o elemento específico
app.post('/render', async (req, res) => {
    const { url } = req.body;
    
    console.log('Solicitação recebida para renderizar a URL:', url);  // Log da solicitação recebida

    if (!url) {
        console.log('Erro: URL não fornecida');  // Log de erro caso a URL não seja fornecida
        return res.status(400).json({ error: 'URL é necessária!' });
    }

    try {
        console.log('Iniciando o navegador Puppeteer...');
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'], 
            headless: true,
            timeout: 90000 // Aumentando o tempo limite para 90 segundos
        });
        
        const page = await browser.newPage();
        console.log('Abertura da nova página no Puppeteer');

        // Define uma viewport inicial (ajuda no carregamento da página)
        await page.setViewport({ width: 1500, height: 1500 });

        console.log('Navegando para a URL:', url);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 }); // Aumentando o timeout para 90 segundos

        const elementSelector = '#templete'; // Seletor do elemento que será capturado
        console.log('Aguardando o seletor do elemento:', elementSelector);
        
        // Aguardar o elemento aparecer
        await page.waitForSelector(elementSelector); 

        // Ajusta o tamanho do elemento para 1500x1500 pixels
        await page.evaluate((selector) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.width = '1500px';
                element.style.height = '1500px';
            }
        }, elementSelector);

        // Captura somente o elemento especificado
        const element = await page.$(elementSelector); 
        const screenshot = await element.screenshot({ type: 'png', encoding: 'base64' }); 

        console.log('Imagem capturada com sucesso!');
        await browser.close(); 

        // Retorna a imagem em base64
        res.json({ image: `data:image/png;base64,${screenshot}` });

    } catch (error) {
        console.error('Erro durante a renderização:', error); // Log do erro
        res.status(500).json({ error: 'Erro ao renderizar o elemento.' });
    }
});

// Configura a porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
