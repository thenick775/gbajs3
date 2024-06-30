#!/bin/zsh

env_directories=("." "postgres" "gbajs3" "auth" "admin")
default_directories=("")

# copy example env files
read "REPLY?Do you want to copy .env.example to .env in all directories? (y/n) "

if [[ $REPLY == "y" || $REPLY == "Y" ]]; then
  for dir in "${env_directories[@]}"; do
    if [ -d "$dir" ]; then
      cp "$dir/.env.example" "$dir/.env" && \
      echo "Copied .env.example to .env in $dir"
    else
      echo "Directory $dir does not exist."
    fi
  done
else
  echo "Operation cancelled."
fi

# source the root env file for easy access to pre-defined paths
if [ -f ./.env ]; then
    source ./.env && \
    echo "root .env file sourced successfully."
fi

# create default directories
read "REPLY?Do you want to create default directories? (y/n) "

required_vars=("ROM_PATH" "SAVE_PATH" "CERT_DIR")

for var in "${required_vars[@]}"; do
    if [ -z "${(P)var}" ]; then
        echo "Error: Environment variable $var is not set. Source the root .env or .env.example and re-run this script"
        exit 1
    fi
done

if [[ $REPLY == "y" || $REPLY == "Y" ]]; then
  for dir in "$ROM_PATH" "$SAVE_PATH" "$CERT_DIR"; do
    if [ ! -d "$dir" ]; then
      mkdir -p "$dir" && \
      echo "Created directory: $dir"
    else
      echo "Directory already exists: $dir"
    fi
  done
else
  echo "Operation cancelled."
fi

# generate certificates if possible
if command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is already installed."

  read "REPLY?Do you want to generate certificates at $CERT_DIR? (y/n) "

  if [[ $REPLY == "y" || $REPLY == "Y" ]]; then
    openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout $KEY_LOC -out $CERT_LOC && \
    echo "Certificates created successfully"
  else
    echo "Operation cancelled."
  fi
else
  echo "OpenSSL is not installed, skipping certificate generation."
fi
