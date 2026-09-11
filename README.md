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

> ❕Este é um protótipo demonstrativo. Parte do código foi desenvolvida com auxílio do GitHub Copilot e revisada por humanos, podendo, portanto, conter erros. ❕
