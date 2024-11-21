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
