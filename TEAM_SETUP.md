# Configuration Backend - PrepFA

## Installation pour les nouveaux développeurs

### 1. Cloner le projet
```bash
git clone [URL_DU_REPO]
cd prepfa
```

### 2. Configurer le backend

#### Installer les dépendances
```bash
cd back
npm install
```

#### Créer votre fichier .env
Copiez le fichier `.env.example` et renommez-le en `.env` :
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Windows (CMD)
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

#### Configurer les variables d'environnement
Ouvrez le fichier `.env` et remplacez les valeurs par celles fournies par l'équipe :

```env
MONGO_URI=mongodb+srv://dbUser:VOTRE_MOT_DE_PASSE@cluster0.bepnrlg.mongodb.net/prepfa?appName=Cluster0
PORT=4000
JWT_SECRET=votre_cle_secrete_jwt
```

**Important** : Demandez à votre administrateur de projet de vous fournir :
- Le mot de passe MongoDB (`VOTRE_MOT_DE_PASSE`)
- La clé secrète JWT (`votre_cle_secrete_jwt`)

#### Démarrer le serveur backend
```bash
npm start
```

### 3. Configurer le frontend

```bash
cd front
npm install
npm start
```

## 📌 Note de sécurité
- **Ne jamais commiter le fichier `.env`** dans Git
- Partagez les informations sensibles via un canal sécurisé (Discord privé, message direct, gestionnaire de mots de passe)
- Chaque développeur doit avoir son propre fichier `.env` local
