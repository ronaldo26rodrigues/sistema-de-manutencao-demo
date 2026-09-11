# Guia de configuração e execução

Este projeto usa um backend em Python e um frontend em npm. Como o frontend já é servido pelo backend, a sequência de execução é simples:

1. Crie e ative um ambiente virtual:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
```

2. Instale as dependências do backend:

```bash
pip install -r requirements.txt
```

3. Instale as dependências do frontend e gere a build:

```bash
npm install
npm run build
```

4. Execute o backend:

```bash
python main.py
```

A aplicação ficará disponível pelo backend localmente, com o frontend já integrado à build gerada.

Observação sobre a localização dos arquivos de dependências:

- O backend fica na raiz do projeto, em `c:\Users\ronal\OneDrive\Documentos\Projetos\case manutencao`, e o arquivo de dependências é `requirements.txt`. Para instalar as dependências do backend, é preciso entrar nessa pasta com:

```bash
cd c:\Users\ronal\OneDrive\Documentos\Projetos\case manutencao
pip install -r requirements.txt
```

- O módulo frontend fica em uma pasta separada, por exemplo `frontend`, dentro do projeto, onde estão os arquivos `package.json` e `package-lock.json` (ou `package.json` no diretório do módulo frontend). Para instalar as dependências do frontend, é preciso entrar nessa pasta com:

```bash
cd c:\Users\ronal\OneDrive\Documentos\Projetos\case manutencao\frontend
npm install
```

Se a pasta do frontend estiver em outra subpasta do projeto, use o mesmo padrão: `cd <caminho-da-pasta-do-frontend>` antes de executar `npm install` e `npm run build`.
