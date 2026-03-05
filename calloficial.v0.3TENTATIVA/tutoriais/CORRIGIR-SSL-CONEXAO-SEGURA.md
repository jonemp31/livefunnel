# 🔒 Corrigir: "Conexão não é totalmente segura"

## 🚨 Problema

A mensagem "Conexão não é totalmente segura" aparece quando:
- A página está em HTTPS, mas carrega recursos HTTP (mixed content)
- O certificado SSL está inválido ou auto-assinado
- Há recursos externos em HTTP

## ✅ Solução 1: URLs já corrigidas no código

As URLs do vídeo e avatar foram alteradas para HTTPS no código. Agora você precisa:

1. **Fazer novo build:**
   ```bash
   npm run build
   ```

2. **Fazer upload dos novos arquivos**

## 🔧 Solução 2: Configurar SSL no cPanel

### Passo 1: Verificar SSL Atual

1. No cPanel, procure por **"SSL/TLS Status"** ou **"SSL/TLS"**
2. Verifique se há um certificado ativo para `privacygi.com`
3. Verifique se há certificado para o subdomínio (se aplicável)

### Passo 2: Instalar/Atualizar Certificado SSL

**Opção A: Let's Encrypt (Recomendado - Gratuito)**

1. No cPanel, procure por **"SSL/TLS"** ou **"Let's Encrypt"**
2. Clique em **"Manage SSL sites"** ou **"SSL/TLS Status"**
3. Selecione o domínio `privacygi.com`
4. Clique em **"Run AutoSSL"** ou **"Install"**
5. Aguarde alguns minutos para o certificado ser instalado

**Opção B: Certificado Comercial**

1. Se você tem um certificado comercial, use a opção **"Install and Manage SSL"**
2. Cole o certificado, chave privada e certificado intermediário
3. Clique em **"Install Certificate"**

### Passo 3: Forçar HTTPS

1. No cPanel, procure por **"Force HTTPS Redirect"**
2. Ou adicione no `.htaccess`:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

## 🔍 Solução 3: Verificar Mixed Content

### Verificar no Console do Navegador

1. Abra o site
2. Pressione **F12**
3. Vá na aba **Console**
4. Procure por avisos sobre "mixed content" ou "insecure content"

### Verificar no Network

1. F12 > **Network**
2. Recarregue a página
3. Veja quais recursos estão sendo carregados
4. Verifique se algum está em **HTTP** (deve ser tudo **HTTPS**)

## 🎯 Checklist de Verificação

- [ ] Certificado SSL instalado e ativo
- [ ] Site acessível via `https://privacygi.com/salaprivada/`
- [ ] Cadeado verde no navegador (sem avisos)
- [ ] Todas as URLs no código estão em HTTPS
- [ ] Novo build feito após alterar URLs
- [ ] Arquivos atualizados no servidor
- [ ] Cache do navegador limpo

## ⚠️ Problemas Comuns

### Problema: Certificado inválido

**Sintoma:** Cadeado vermelho ou aviso de certificado inválido

**Solução:**
1. Verifique se o certificado está instalado corretamente
2. Verifique se não está expirado
3. Use Let's Encrypt para certificado válido

### Problema: Mixed Content ainda aparece

**Sintoma:** Console mostra avisos de mixed content

**Solução:**
1. Verifique se todas as URLs no código estão em HTTPS
2. Verifique recursos externos (imagens, scripts, etc.)
3. Use HTTPS para todos os recursos

### Problema: Câmera ainda não funciona

**Sintoma:** Permissão negada ou erro ao acessar câmera

**Solução:**
1. Certifique-se de que está usando HTTPS
2. Verifique se o certificado é válido (não auto-assinado)
3. Teste em diferentes navegadores
4. Verifique permissões do navegador

## 📝 Notas Importantes

1. **HTTPS é obrigatório** para `getUserMedia()` (câmera)
2. **Certificados auto-assinados** podem não funcionar em alguns navegadores
3. **Let's Encrypt** é gratuito e válido para produção
4. **Mixed content** bloqueia recursos e pode impedir a câmera

## 🔄 Após Corrigir

1. Faça novo build: `npm run build`
2. Faça upload dos novos arquivos
3. Limpe o cache do navegador (Ctrl+Shift+R)
4. Teste a câmera novamente

---

**Última atualização:** Guia para corrigir conexão não segura


