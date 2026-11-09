# Founding document source

`founding-document.html` is the editable source for `docs/Tock-Founding-Document.pdf`.
Edit the HTML, then rebuild the PDF with Chrome (it needs internet access for fonts and the diagram):

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --no-pdf-header-footer --virtual-time-budget=15000 --print-to-pdf="docs/Tock-Founding-Document.pdf" "file:///C:/Users/xande/qr-signin-admin/docs/founding/founding-document.html"
```
