# 🚀 Guia de Build e Deploy no cPanel

## 📋 Pré-requisitos

1. Node.js instalado no seu computador (para fazer o build)
2. Acesso ao cPanel do seu servidor
3. Acesso via FTP ou File Manager do cPanel

## 🔨 Passo 1: Fazer o Build Local

### 1.1. Instalar dependências (se ainda não instalou)
```bash
npm install
```

### 1.2. Executar o build
```bash
npm run build
```

Este comando irá:
- Compilar o TypeScript
- Fazer o build do projeto com Vite
- Gerar os arquivos otimizados na pasta `dist/`

### 1.3. Verificar os arquivos gerados
Após o build, você terá uma pasta `dist/` com os arquivos prontos para produção:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── vite.svg (se existir)
```

## 📤 Passo 2: Preparar para Upload

### 2.1. Verificar o conteúdo da pasta `dist/`
Certifique-se de que todos os arquivos necessários estão na pasta `dist/`:
- `index.html` (arquivo principal)
- Pasta `assets/` com todos os arquivos JS e CSS

### 2.2. Comprimir (opcional)
Você pode comprimir a pasta `dist/` em um arquivo ZIP para facilitar o upload:
- Windows: Clique com botão direito > Enviar para > Pasta compactada
- Mac/Linux: `zip -r dist.zip dist/`

## 🌐 Passo 3: Upload para cPanel

### Opção A: Via File Manager do cPanel

1. **Acesse o cPanel**
   - Faça login no seu cPanel
   - Procure por "File Manager" ou "Gerenciador de Arquivos"

2. **Navegue até a pasta de destino**
   - Geralmente é `public_html/` ou `www/`
   - Ou uma subpasta como `public_html/video-call/` (se quiser em subdiretório)

3. **Faça upload dos arquivos**
   - Clique em "Upload" ou "Enviar"
   - Selecione todos os arquivos da pasta `dist/`
   - Ou faça upload do ZIP e extraia no cPanel

4. **Extrair ZIP (se necessário)**
   - Clique com botão direito no arquivo ZIP
   - Selecione "Extract" ou "Extrair"
   - Mova os arquivos para a pasta correta

### Opção B: Via FTP

1. **Conecte-se via FTP**
   - Use um cliente FTP (FileZilla, WinSCP, etc.)
   - Host: seu-dominio.com ou IP do servidor
   - Usuário e senha do cPanel

2. **Navegue até a pasta de destino**
   - Normalmente: `/public_html/` ou `/public_html/video-call/`

3. **Faça upload**
   - Arraste todos os arquivos da pasta `dist/` local
   - Para a pasta de destino no servidor

## ⚙️ Passo 4: Configurações no cPanel

### 4.1. Verificar permissões de arquivos
- Arquivos: `644` ou `644`
- Pastas: `755`
- No File Manager, clique com botão direito > "Change Permissions"

### 4.2. Configurar HTTPS (IMPORTANTE)
Como o projeto precisa de HTTPS para acessar a câmera:

1. **Certificado SSL**
   - No cPanel, procure por "SSL/TLS Status"
   - Certifique-se de que há um certificado SSL ativo
   - Se não tiver, use "Let's Encrypt" (gratuito)

2. **Forçar HTTPS (opcional)**
   - No cPanel, procure por "Force HTTPS Redirect"
   - Ou adicione no `.htaccess`:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

### 4.3. Configurar .htaccess (se necessário)

Crie um arquivo `.htaccess` na pasta raiz do projeto com:

```apache
# Habilitar compressão
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Cache de arquivos estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Forçar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA - Redirecionar todas as rotas para index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## ✅ Passo 5: Verificar o Deploy

1. **Acesse a URL**
   - `https://seu-dominio.com/` (se na raiz)
   - `https://seu-dominio.com/video-call/` (se em subdiretório)

2. **Teste as funcionalidades**
   - Verifique se a página carrega
   - Teste o acesso à câmera (precisa HTTPS)
   - Teste o carregamento do vídeo
   - Teste o chat

## 🔧 Troubleshooting

### Problema: Página em branco
- Verifique se todos os arquivos foram enviados
- Verifique o console do navegador (F12) para erros
- Verifique se o caminho dos assets está correto

### Problema: Câmera não funciona
- **IMPORTANTE**: Certifique-se de que está usando HTTPS
- Verifique se o certificado SSL está ativo
- Teste em diferentes navegadores

### Problema: Vídeo não carrega
- Verifique se as URLs do vídeo estão corretas no código
- Verifique CORS no servidor de vídeo
- Verifique o console do navegador para erros

### Problema: 404 em rotas
- Adicione o `.htaccess` com as regras de SPA
- Verifique se o mod_rewrite está habilitado no servidor

## 📝 Checklist Final

- [ ] Build executado com sucesso (`npm run build`)
- [ ] Arquivos da pasta `dist/` enviados para o servidor
- [ ] Certificado SSL ativo e funcionando
- [ ] Site acessível via HTTPS
- [ ] `.htaccess` configurado (se necessário)
- [ ] Permissões de arquivos corretas
- [ ] Testado em diferentes navegadores
- [ ] Câmera funcionando (teste em mobile)
- [ ] Vídeo carregando corretamente
- [ ] Chat funcionando

## 🎯 Dicas Importantes

1. **Sempre use HTTPS** - O projeto precisa de HTTPS para acessar a câmera
2. **Teste em mobile** - A funcionalidade principal é para dispositivos móveis
3. **Backup antes de fazer deploy** - Sempre faça backup dos arquivos antigos
4. **Monitore o console** - Use F12 no navegador para ver erros
5. **Cache do navegador** - Limpe o cache após fazer deploy (Ctrl+Shift+R)

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do servidor no cPanel
3. Teste em modo anônimo/privado
4. Verifique se todas as dependências foram instaladas

---

**Última atualização:** Versão com acesso único implementado


