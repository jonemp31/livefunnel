# 🔧 Troubleshooting: Página em Branco no cPanel

## 🔍 Diagnóstico Rápido

### 1. Abra o Console do Navegador
1. Pressione **F12** no navegador
2. Vá na aba **Console**
3. Veja se há erros em vermelho

### 2. Verifique a Aba Network
1. No console, vá na aba **Network**
2. Recarregue a página (F5)
3. Veja quais arquivos estão dando erro 404

## 🛠️ Soluções Comuns

### Problema 1: Assets não encontrados (404)

**Sintoma:** Console mostra erros como:
- `Failed to load resource: 404`
- `index-[hash].js not found`
- `index-[hash].css not found`

**Causa:** Caminhos absolutos não funcionam em subdiretórios

**Solução A: Se está na RAIZ do domínio**
```bash
# Não precisa fazer nada, está correto
```

**Solução B: Se está em SUBDIRETÓRIO** (ex: `/video-call/`)

1. **Ajuste o `vite.config.ts`:**
```typescript
export default defineConfig({
  base: '/video-call/', // Adicione esta linha com o caminho do subdiretório
  // ... resto da configuração
})
```

2. **Faça o build novamente:**
```bash
npm run build
```

3. **Faça upload novamente**

### Problema 2: Arquivos não foram enviados corretamente

**Verifique se TODOS estes arquivos estão no servidor:**
- ✅ `index.html` (na raiz ou subdiretório)
- ✅ Pasta `assets/` com:
  - ✅ `index-[hash].js`
  - ✅ `index-[hash].css`
  - ✅ Outros arquivos se houver

**Como verificar:**
1. No cPanel File Manager, verifique se todos os arquivos estão lá
2. Certifique-se de que a estrutura está correta:
   ```
   public_html/
   ├── index.html
   └── assets/
       ├── index-abc123.js
       └── index-abc123.css
   ```

### Problema 3: Permissões de arquivos incorretas

**Solução:**
1. No File Manager do cPanel
2. Selecione todos os arquivos
3. Clique com botão direito > "Change Permissions"
4. Configure:
   - Arquivos: `644`
   - Pastas: `755`

### Problema 4: Erro de JavaScript no console

**Sintoma:** Console mostra erros JavaScript

**Soluções:**
1. **Limpe o cache do navegador:**
   - Chrome/Edge: Ctrl + Shift + Delete
   - Ou use modo anônimo (Ctrl + Shift + N)

2. **Verifique se está usando HTTPS:**
   - O projeto PRECISA de HTTPS
   - Acesse via `https://` não `http://`

3. **Verifique o certificado SSL:**
   - No cPanel, vá em "SSL/TLS Status"
   - Certifique-se de que há um certificado ativo

### Problema 5: .htaccess causando problemas

**Solução:**
1. Renomeie temporariamente o `.htaccess` para `.htaccess.bak`
2. Teste se a página carrega
3. Se carregar, o problema está no `.htaccess`
4. Use este `.htaccess` simplificado:

```apache
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

## 📋 Checklist de Verificação

Execute este checklist na ordem:

- [ ] **1. Console do navegador (F12)**
  - [ ] Abriu sem erros?
  - [ ] Se há erros, quais são?

- [ ] **2. Arquivos no servidor**
  - [ ] `index.html` está presente?
  - [ ] Pasta `assets/` existe?
  - [ ] Arquivos JS e CSS estão na pasta `assets/`?

- [ ] **3. Caminho correto**
  - [ ] Está na raiz? (`public_html/`)
  - [ ] Está em subdiretório? (ajustar `base` no vite.config.ts)

- [ ] **4. HTTPS**
  - [ ] Está acessando via `https://`?
  - [ ] Certificado SSL está ativo?

- [ ] **5. Permissões**
  - [ ] Arquivos: `644`
  - [ ] Pastas: `755`

- [ ] **6. Cache**
  - [ ] Limpou o cache do navegador?
  - [ ] Testou em modo anônimo?

## 🎯 Solução Rápida (Passo a Passo)

### Se está na RAIZ do domínio:

1. **Verifique os arquivos:**
   ```bash
   # Localmente, verifique se o build gerou tudo:
   ls dist/
   # Deve mostrar: index.html e pasta assets/
   ```

2. **Faça upload novamente:**
   - Delete todos os arquivos antigos no servidor
   - Faça upload de TODOS os arquivos da pasta `dist/`
   - Certifique-se de que `index.html` está na raiz

3. **Crie/Atualize o `.htaccess`:**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

4. **Teste:**
   - Acesse `https://seu-dominio.com/`
   - Abra o console (F12)
   - Veja se há erros

### Se está em SUBDIRETÓRIO:

1. **Ajuste o `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     base: '/nome-do-subdiretorio/', // Ex: '/video-call/'
     // ... resto
   })
   ```

2. **Faça build novamente:**
   ```bash
   npm run build
   ```

3. **Faça upload:**
   - Delete arquivos antigos
   - Faça upload dos novos arquivos da pasta `dist/`

4. **Ajuste o `.htaccess`:**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /nome-do-subdiretorio/
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /nome-do-subdiretorio/index.html [L]
   </IfModule>
   ```

## 🔍 Verificação Avançada

### Ver o HTML gerado:
1. No navegador, clique com botão direito > "Ver código-fonte"
2. Procure por:
   ```html
   <script type="module" src="/assets/index-[hash].js"></script>
   ```
3. Clique no link do script
4. Veja se carrega ou dá 404

### Verificar Network:
1. F12 > Network
2. Recarregue a página
3. Veja quais arquivos estão:
   - ✅ Verde (200) = OK
   - ❌ Vermelho (404) = Não encontrado
   - ⚠️ Amarelo (outros) = Verificar

## 💡 Dicas Importantes

1. **Sempre use HTTPS** - O projeto não funciona sem HTTPS
2. **Limpe o cache** - Muitos problemas são de cache
3. **Verifique o console** - Sempre veja os erros primeiro
4. **Teste em modo anônimo** - Elimina problemas de cache
5. **Verifique a estrutura** - Arquivos devem estar na mesma estrutura do `dist/`

## 📞 Se ainda não funcionar

Envie estas informações:
1. Screenshot do console (F12)
2. Screenshot da aba Network (F12 > Network)
3. Estrutura de arquivos no servidor
4. URL completa onde está hospedado
5. Se está na raiz ou subdiretório

---

**Última atualização:** Guia de troubleshooting para página em branco


