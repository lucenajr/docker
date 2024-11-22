# Docker configuration


### Volumes vs Bind mounts

1. Volumes
Volumes são gerenciados diretamente pelo Docker e são a abordagem recomendada para persistir dados entre contêineres e suas execuções.

Localização:
Docker armazena os volumes em um local específico no host (/var/lib/docker/volumes/ em sistemas Linux).
Você não precisa saber onde o volume está fisicamente no sistema de arquivos do host.

Gerenciamento:
Podem ser criados, listados e removidos via comandos Docker (docker volume create, docker volume ls, etc.).
São independentes de contêineres, ou seja, podem ser compartilhados entre múltiplos contêineres.

Segurança e Isolamento:
Volumes fornecem isolamento entre os dados e o sistema de arquivos do host.
O Docker controla o acesso e gerencia os dados.

Uso típico:
Quando os dados devem persistir após a exclusão de contêineres.
Para compartilhar dados entre múltiplos contêineres.
Para armazenar dados em ambientes onde o Docker Engine gerencia o armazenamento.

2. Bind Mounts
Bind mounts mapeiam diretamente um diretório ou arquivo do sistema de arquivos do host para um contêiner.

Localização:
Usam exatamente o caminho especificado do sistema de arquivos do host, por exemplo, /path/to/dir:/data no contêiner.
O diretório ou arquivo no host deve existir antes de ser montado.

Gerenciamento:
Não são gerenciados pelo Docker; você precisa gerenciá-los manualmente.
Não aparecem em comandos como docker volume ls.

Segurança e Isolamento:
Menos seguros, pois concedem acesso direto ao sistema de arquivos do host.
Problemas de permissões e erros acidentais podem afetar o sistema do host.

Uso típico:
Durante o desenvolvimento, onde mudanças no código-fonte do host precisam ser refletidas imediatamente no contêiner.
Para acessar arquivos específicos no host que não precisam ser gerenciados pelo Docker.


Quando Usar o Que?
Use volumes quando você deseja armazenar dados persistentemente, compartilhar entre contêineres ou trabalhar em produção.
Use bind mounts quando precisar de acesso direto a arquivos no host, especialmente em ambientes de desenvolvimento.

Backup dos volumes com busybox

`docker run --rm \
    -v <nome-do-volume>:/data:ro \
    -v $(pwd):/backup \
    busybox \
    tar czvf /backup/backup-volume.tar.gz -C /data .
`

1. --rm: Remove o contêiner temporário após sua execução.
2. -v <nome-do-volume>:/data:ro: Monta o volume como somente leitura (ro) no contêiner.
3. -v $(pwd):/backup: Monta o diretório atual do host no contêiner para salvar o backup.
4. tar czvf /backup/backup-volume.tar.gz -C /data .: Compacta o conteúdo do volume.

Restaurando backups

`docker run --rm \
    -v <nome-do-volume>:/data \
    -v $(pwd):/backup \
    busybox \
    tar xzvf /backup/backup-volume.tar.gz -C /data
`

- -v <nome-do-volume>:/data: Monta o volume onde os dados serão restaurados.
- -v $(pwd):/backup: Monta o diretório onde o backup está armazenado.


### Informações do Docker em disco

`
docker system df
`


### Informações de vulnerabilidades

`
docker scout quickview <image>
`

`
docker scout cves <image>
`

### Sempre utilizar usuário que não seja root

`
RUN adduser -m <USER>
`

`
USER <USER>
`

### HEALTHCHECK
Um healthcheck que verifica se um servidor HTTP está respondendo corretamente:

`
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost:80 || exit 1
`

Verifica a URL http://localhost:80 a cada 30 segundos.
Declara o contêiner como unhealthy se o comando falhar 3 vezes consecutivas.


Aqui está o arquivo completo para você copiar e colar diretamente no seu `README.md`:

```markdown
# Docker e Dockerfile

## 1. Introdução ao Docker e Dockerfile

O Docker é uma plataforma que permite empacotar, distribuir e executar aplicações em containers, garantindo que elas funcionem de maneira consistente em diferentes ambientes. Um **Dockerfile** é um script que contém uma série de instruções para construir uma imagem Docker. Ele define todos os componentes necessários para executar sua aplicação, desde a imagem base até as dependências e configurações.

---

## 2. Estrutura Básica de um Dockerfile

### Exemplo de Dockerfile para uma aplicação Node.js:

```dockerfile
ARG NODE_VERSION=21.1.0
FROM node:${NODE_VERSION}

RUN apt-get update \
    && apt-get install -y vim \
    && rm -rf /var/lib/apt/lists/*

ENV PORT=3001
ENV MESSAGE="Hello Docker!"

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD [ "curl","-f","http://localhost:3001" ]

EXPOSE 3001
CMD ["node", "index.js"]
```

Este Dockerfile contém várias instruções importantes que serão exploradas detalhadamente.

---

## 3. Instruções Detalhadas do Dockerfile

### **FROM** e **ARG**
- **FROM**: Especifica a imagem base da qual sua imagem será construída.
  ```dockerfile
  FROM node:${NODE_VERSION}
  ```
- **ARG**: Define variáveis de build.
  ```dockerfile
  ARG NODE_VERSION=21.1.0
  ```
- Uso:
  ```bash
  docker build --build-arg NODE_VERSION=16.13.0 -t my-node-app .
  ```

### **RUN**
- Executa comandos durante a construção da imagem.
  ```dockerfile
  RUN apt-get update \
      && apt-get install -y vim \
      && rm -rf /var/lib/apt/lists/*
  ```

### **ENV**
- Define variáveis de ambiente disponíveis em tempo de execução.
  ```dockerfile
  ENV PORT=3001
  ENV MESSAGE="Hello Docker!"
  ```

### **WORKDIR**
- Define o diretório de trabalho no container.
  ```dockerfile
  WORKDIR /app
  ```

### **COPY**
- Copia arquivos do sistema host para o container.
  ```dockerfile
  COPY package*.json ./
  RUN npm install
  COPY . .
  ```

### **HEALTHCHECK**
- Permite verificar a saúde do container.
  ```dockerfile
  HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
      CMD [ "curl", "-f", "http://localhost:3001" ] || exit 1
  ```

### **EXPOSE**
- Documenta a porta em que a aplicação estará escutando.
  ```dockerfile
  EXPOSE 3001
  ```

### **CMD** e **ENTRYPOINT**
- **CMD**: Define o comando padrão para execução.
  ```dockerfile
  CMD ["node", "index.js"]
  ```

- **ENTRYPOINT**: Define o executável principal, mais fixo que o `CMD`.

---

## 4. Uso de .dockerignore

Exemplo de `.dockerignore`:
```
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
```

---

## 5. Multi-stage Builds e Otimização de Imagens

### Exemplo de Dockerfile com multi-stage build para aplicação Go:
```dockerfile
FROM golang:latest AS builder

LABEL maintainer="Wesley Willians"

WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o server main.go

# Final stage
FROM scratch
USER 1001
COPY --from=builder /app/server /server
ENTRYPOINT ["./server"]
```

---

## 6. Passando Variáveis e Argumentos no `docker run`

- Passando variáveis de ambiente:
  ```bash
  docker run -e MESSAGE="Hello from Docker!" -e PORT=4000 -p 4000:4000 my-node-app
  ```

- Sobrescrevendo o `ENTRYPOINT`:
  ```bash
  docker run --entrypoint /bin/sh my-go-app
  ```

```markdown
# Resumo do Capítulo

## 1. Introdução ao Docker Networking

O Docker oferece um sistema de redes completo para conectar containers entre si e com o mundo externo. Compreender o funcionamento dessas redes é fundamental para o desenvolvimento de aplicações distribuídas e escaláveis.

---

## 2. Conceitos Básicos de Rede no Docker

### Tipos de Redes no Docker

- **Bridge (Ponte)**:
  - Rede padrão para containers independentes.
  - Permite isolamento entre containers e o host.
  - Comunicação entre containers pelo nome, em redes bridge personalizadas.

- **Host**:
  - O container compartilha a interface de rede do host.
  - Indicado para casos de alto desempenho ou portas privilegiadas.
  - Limitações no macOS e Windows; o modo bridge é mais compatível no Docker Desktop.

### Como os Containers se Conectam às Redes

- **Interfaces Virtuais**: Cada container possui uma interface virtual.
- **Endereços IP**: Containers recebem IPs privados dentro da rede configurada.
- **Resolução de Nomes**: Docker configura DNS interno para redes bridge personalizadas.

---

## 3. Comunicação entre Containers na Mesma Rede

### Exemplo Prático: Aplicação Node.js e MongoDB

#### Passos:
1. **Preparar a Aplicação Node.js**:
   - A aplicação conecta ao MongoDB no host `db` e porta `27017`.

2. **Criar Dockerfile e .dockerignore**:
   - Configurações para construir a imagem da aplicação.

3. **Construir e Configurar a Rede**:
   - Criar uma rede bridge personalizada: `docker network create app-network`.

4. **Iniciar Containers**:
   - MongoDB: `docker run -d --name db --network app-network mongo:latest`.
   - Node.js: `docker run -d --name app --network app-network mynode_app_network`.

5. **Verificar Comunicação**:
   - Logs da aplicação devem indicar sucesso: *Connected to MongoDB*.

---

## 4. Comunicação entre Containers e o Host

### Utilizando `host.docker.internal`

- **Descrição**: Resolve o IP do host para acesso a serviços.
- **Linux**: Use `host-gateway` para resolver o IP do host.

#### Exemplo:
- Configurar um container para acessar uma aplicação Node.js rodando no host.

```bash
docker run -d --name nginx --add-host=host.docker.internal:host-gateway nginx
```

- Testar conexão com `curl http://host.docker.internal:3000`.

---

## 5. Gerenciando Múltiplas Redes e Isolamento

Containers podem ser conectados a várias redes, permitindo comunicação seletiva.

### Exemplo Prático:

1. **Criar Redes**:
   - `docker network create backend-net`.
   - `docker network create db-net`.

2. **Iniciar Containers**:
   - MongoDB: `db-net`.
   - Aplicação Node.js: `backend-net`.

3. **Conectar Redes**:
   - `docker network connect db-net app`.

4. **Resultados**:
   - Inicialmente, sem conexão entre redes.
   - Após conectar, comunicação estabelecida.

---

## 6. Modos de Rede: Bridge vs. Host

### Modo Bridge

- **Vantagens**:
  - Isolamento entre containers e do host.
  - Compatível com todos os sistemas operacionais.

### Modo Host

- **Vantagens**:
  - Melhora desempenho para casos específicos.
  - Não exige mapeamento de portas.

- **Considerações**:
  - Menos seguro devido à falta de isolamento.
  - Limitado no Docker Desktop para macOS/Windows.

---

Este capítulo fornece uma base sólida para o uso de redes no Docker, abordando desde configurações básicas até práticas avançadas de gerenciamento e segurança.
```


```markdown
# Resumo do Capítulo

## 1. Introdução ao Docker Compose

O Docker Compose é uma ferramenta para definir e executar aplicações Docker multicontainer. Ele utiliza um arquivo YAML para configurar serviços e, com um único comando, cria e inicia os containers definidos.

### História
- **Docker Compose V1**: Lançado em 2014 como ferramenta separada.
- **Docker Compose V2+**: Integrado ao Docker CLI com melhorias de desempenho.

### Por que usar o Docker Compose?
- **Simplicidade**: Gerencia múltiplos containers com facilidade.
- **Reprodutibilidade**: Configuração e compartilhamento simplificados.
- **Escalabilidade**: Facilita o escalonamento de serviços.

---

## 2. Criando os Primeiros Serviços

### Aplicação Node.js
#### Estrutura de Arquivos
- **Diretório:** `./node/`
  - Dockerfile
  - index.js
  - package.json
  - .env
  - .dockerignore

#### Código da Aplicação (`index.js`)
```javascript
const mongoose = require("mongoose");

mongoose
  .connect("mongodb://mongo:27017/test")
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.log(err));
```

#### Dockerfile
```dockerfile
FROM node:lts-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
CMD ["node", "index.js"]
```

#### Configuração no `docker-compose.yml`
```yaml
services:
  nodeapp:
    build:
      context: ./node
      dockerfile: Dockerfile
```

### Servidor Nginx
#### Estrutura de Arquivos
- **Diretório:** `./nginx-html/`
  - index.html

#### Arquivo `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Nginx Container</title>
</head>
<body>
    Hello World
</body>
</html>
```

#### Configuração no `docker-compose.yml`
```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
```

---

## 3. Definindo Dependências e Healthchecks

### Serviço MongoDB com Healthcheck
```yaml
services:
  mongo:
    image: mongo:latest
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      retries: 5
      start_period: 10s
      timeout: 5s
```

### Configuração `depends_on`
```yaml
services:
  nodeapp:
    depends_on:
      mongo:
        condition: service_healthy
```

---

## 4. Trabalhando com Volumes e Bind Mounts

### Persistindo Dados com Volumes
```yaml
services:
  mongo:
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Utilizando Bind Mounts
```yaml
services:
  nodeapp:
    volumes:
      - ./node:/app
```

---

## 5. Variáveis de Ambiente e Arquivo `.env`

### Usando `environment`
```yaml
services:
  nodeapp:
    environment:
      - MY_VAR=123456
```

### Usando Arquivo `.env`
- **Arquivo:** `./node/.env`
  ```env
  API_KEY=abcdef12345
  ```

```yaml
services:
  nodeapp:
    env_file:
      - ./node/.env
```

---

## 6. Gerenciando Redes no Docker Compose

### Criando Redes
```yaml
networks:
  backend:
  db-net:
  frontend:
```

### Conectando Serviços às Redes
```yaml
services:
  nodeapp:
    networks:
      - backend
      - db-net

  mongo:
    networks:
      - db-net

  nginx:
    networks:
      - frontend
```

---

## 7. Utilizando `extra_hosts`
```yaml
services:
  nodeapp:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

---

## 8. Introdução ao Compose Watch

### Configurando `compose-watch`
```yaml
services:
  nodeapp-watch:
    build:
      context: ./node
      dockerfile: Dockerfile
    develop:
      watch:
        - path: ./node
          target: /app
          action: sync
          ignore:
            - "./node/node_modules"
        - path: ./node/package.json
          action: rebuild
        - path: ./node/index.js
          target: /app/index.js
          action: sync+restart
```

---

## 9. Arquivo `docker-compose.yml` Completo
```yaml
services:
  nodeapp:
    build:
      context: ./node
      dockerfile: Dockerfile
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      - MY_VAR=123456
    env_file:
      - ./node/.env
    volumes:
      - ./node:/app
    networks:
      - backend
      - db-net
    extra_hosts:
      - "host.docker.internal:host-gateway"

  nodeapp-watch:
    build:
      context: ./node
      dockerfile: Dockerfile
    develop:
      watch:
        - path: ./node
          target: /app
          action: sync
          ignore:
            - "./node/node_modules"
        - path: ./node/package.json
          action: rebuild
        - path: ./node/index.js
          target: /app/index.js
          action: sync+restart
    networks:
      - backend
      - db-net

  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./nginx-html:/usr/share/nginx/html
    networks:
      - frontend

  mongo:
    image: mongo:latest
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      retries: 5
      start_period: 10s
      timeout: 5s
    volumes:
      - mongo_data:/data/db
    networks:
      - db-net

volumes:
  mongo_data:

networks:
  db-net:
  backend:
  frontend:
```


```markdown
# Resumo do Capítulo

## 1. O que é o `docker init`

O `docker init` é um comando introduzido para simplificar a criação de arquivos `Dockerfile` e `docker-compose.yml` em projetos que ainda não os possuem. Ele analisa o código-fonte do seu projeto e gera automaticamente templates otimizados, facilitando o processo de containerização de aplicações.

### Principais benefícios:

- **Automação**: Gera arquivos de configuração Docker automaticamente.
- **Boas práticas**: Os templates seguem as melhores práticas recomendadas pela Docker.
- **Otimizações**: Inclui otimizações de cache e suporte a builds multiplataforma.
- **Flexibilidade**: Suporta várias linguagens e permite personalização posterior.

### Como usar:

Basta navegar até o diretório do seu projeto e executar:

```bash
docker init
```

O comando irá interagir com você para coletar informações sobre o projeto e, em seguida, gerar os arquivos necessários.

---

## 2. Projeto Go com `docker init`

Vamos criar um projeto simples em Go e usar o `docker init` para gerar os arquivos de configuração.

### Passo a Passo:

1. **Crie um diretório para o projeto e navegue até ele:**

    ```bash
    mkdir my-go-app
    cd my-go-app
    ```

2. **Inicie um módulo Go:**

    ```bash
    go mod init my-go-app
    ```

3. **Crie um arquivo `main.go`:**

    ```go
    package main

    import (
        "fmt"
        "net/http"
    )

    func handler(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, Docker!")
    }

    func main() {
        http.HandleFunc("/", handler)
        http.ListenAndServe(":8080", nil)
    }
    ```

4. **Execute `docker init`:**

    ```bash
    docker init
    ```

    **Durante a interação:**
    - `Select the application platform`: Go
    - `Name of the service`: server (padrão)
    - `Which port does your server application listen on?`: 8080
    - `Would you like to include Compose files?`: Yes
    - `Which version of Go do you want to use?`: (padrão ou escolha a versão desejada)

---

### Análise detalhada do Dockerfile Go

```dockerfile
# syntax=docker/dockerfile:1
ARG GO_VERSION=1.23.1
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION} AS build
WORKDIR /src
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.mod,target=go.mod \
    go mod download -x

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,target=. \
    CGO_ENABLED=0 GOARCH=$TARGETARCH go build -o /bin/server ./cmd/server

FROM alpine:latest AS final
RUN --mount=type=cache,target=/var/cache/apk \
    apk --update add \
        ca-certificates \
        tzdata && \
        update-ca-certificates
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser
USER appuser
COPY --from=build /bin/server /bin/
EXPOSE 8080
ENTRYPOINT [ "/bin/server" ]
```

**Principais pontos:**
- Uso de *multi-stage builds* para gerar uma imagem final otimizada.
- Cache e otimizações no processo de build.
- Usuário não privilegiado para segurança.

---

### Análise do `compose.yaml` Go

```yaml
services:
  server:
    build:
      context: .
      target: final
    ports:
      - 8080:8080
```

- **`build`**: Configura o contexto e o alvo do build.
- **`ports`**: Mapeia a porta 8080 do host para o container.

---

## 3. Projeto Node.js com `docker init`

Agora, vamos criar um projeto simples em Node.js e usar o `docker init`.

### Passo a Passo:

1. **Crie um diretório para o projeto e navegue até ele:**

    ```bash
    mkdir my-node-app
    cd my-node-app
    ```

2. **Inicie um projeto Node.js:**

    ```bash
    npm init -y
    ```

3. **Instale dependências necessárias (exemplo: express):**

    ```bash
    npm install express
    ```

4. **Crie um arquivo `index.js`:**

    ```javascript
    const express = require('express');
    const app = express();

    app.get('/', (req, res) => {
      res.send('Hello, Docker!');
    });

    app.listen(3000, () => {
      console.log('App listening on port 3000');
    });
    ```

5. **Execute `docker init`:**

    ```bash
    docker init
    ```

    **Durante a interação:**
    - `Select the application platform`: Node.js
    - `Name of the service`: server (padrão)
    - `Which port does your server application listen on?`: 3000
    - `Would you like to include Compose files?`: Yes
    - `Which version of Node.js do you want to use?`: (padrão ou escolha a versão desejada)

---

### Análise detalhada do Dockerfile Node.js

```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_VERSION=21.1.0
FROM node:${NODE_VERSION}-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
USER node
COPY . .
EXPOSE 3000
CMD node index.js
```

**Principais pontos:**
- Uso de `ENV` para definir o ambiente de produção.
- Instalação de dependências usando `npm ci` para builds reprodutíveis.
- Usuário não privilegiado para execução.

---

### Análise do `compose.yaml` Node.js

```yaml
services:
  server:
    build:
      context: .
    environment:
      NODE_ENV: production
    ports:
      - 3000:3000
```

- **`environment`**: Define variáveis de ambiente.
- **`ports`**: Mapeia a porta 3000 do host para o container.

---

## 4. Projeto de Propósito Geral com `docker init`

Para projetos sem uma linguagem específica, o `docker init` oferece um template básico.

### Passo a Passo:

1. **Execute `docker init`:**

    ```bash
    docker init
    ```

    **Durante a interação:**
    - `Select the application platform`: Other
    - `Name of the service`: (padrão)
    - `Would you like to include Compose files?`: Yes

---

### Análise detalhada do Dockerfile Propósito Geral

```dockerfile
FROM alpine:latest AS base
RUN echo -e '#!/bin/sh\n\
echo Hello world from $(whoami)! In order to get your application running in a container, take a look at the comments in the Dockerfile to get started.'\
> /bin/hello.sh
RUN chmod +x /bin/hello.sh
FROM base AS final
ARG UID=10001
RUN adduser --disabled-password --uid "${UID}" appuser
USER appuser
COPY --from=build /bin/hello.sh /bin/
ENTRYPOINT [ "/bin/hello.sh" ]
```

---

## 5. Entendendo o Uso de Secrets no `docker-compose.yml`

### Exemplo de `compose.yaml` com Secrets:

```yaml
services:
  db:
    image: postgres
    secrets:
      - db-password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db-password
secrets:
  db-password:
    file: db/password.txt
```

**Principais pontos:**
- **`secrets`**: Facilita a gestão de credenciais.
- **Limitações no Docker Compose**: Não oferece criptografia como no Docker Swarm.

---
```