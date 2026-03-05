# ⚡ Solução Rápida: Página em Branco

## 🔍 Passo 1: Verificar o Console (IMPORTANTE)

1. Abra o site no navegador
2. Pressione **F12**
3. Vá na aba **Console**
4. **Me diga quais erros aparecem** (se houver)

## 🎯 Passo 2: Verificar Estrutura de Arquivos

No cPanel File Manager, verifique se tem esta estrutura:

```
public_html/  (ou subdiretório)
├── index.html
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

## ✅ Soluções Rápidas

### Solução 1: Se está na RAIZ do domínio

1. Certifique-se de que todos os arquivos da pasta `dist/` foram enviados
2. O `index.html` deve estar na raiz (`public_html/`)
3. A pasta `assets/` deve estar na mesma raiz

### Solução 2: Se está em SUBDIRETÓRIO

1. Edite o arquivo `vite.config.ts`
2. Descomente e ajuste a linha:
   ```typescript
   base: '/nome-do-subdiretorio/',
   ```
3. Execute `npm run build` novamente
4. Faça upload dos novos arquivos

### Solução 3: Criar .htaccess

Crie um arquivo `.htaccess` na mesma pasta do `index.html`:

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

## 🚨 Verificações Essenciais

- [ ] Está usando **HTTPS**? (não HTTP)
- [ ] Todos os arquivos foram enviados?
- [ ] Permissões corretas? (arquivos: 644, pastas: 755)
- [ ] Limpou o cache do navegador? (Ctrl+Shift+R)

## 📞 Me informe:

1. **Onde está hospedado?** (raiz ou subdiretório)
2. **Quais erros aparecem no console?** (F12 > Console)
3. **A estrutura de arquivos está correta?**

---

Guia completo em: `tutoriais/TROUBLESHOOTING-PAGINA-BRANCA.md`


