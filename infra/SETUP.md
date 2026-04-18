# Setup Instructions

## 1. Clone & Install

```bash
git clone https://github.com/your-user/your-repo.git
cd your-repo
npm install
cd infra && npm install && cd ..
```

---

## 2. Configure Secrets

**App secrets** — variables the app uses at runtime:
```bash
cp .env.local .env
# edit .env with your values
cd infra && npm run push-secrets
```

**CI secrets** — variables the pipeline uses to deploy:
```bash
# edit .env.ci — fill in DOCKER_HUB_USER, DOCKER_HUB_PASSWORD, DOCKER_HUB_REPO, CI_COMMIT_REF_NAME
# leave SSH_PRIVATE_KEY and API_SERVER empty for now
cd infra && npm run push-ci-secrets
```

---

## 3. Provision EC2 (run once)

```bash
cd infra
pulumi stack init dev
pulumi config set aws:region ap-south-1
pulumi config set appName coelor
pulumi up
```

After `pulumi up` finishes:
- Note the `publicIp` output → set as `API_SERVER` in `.env.ci`
- `coelor.pem` is saved in `infra/` automatically

```bash
# SSH key must be pushed directly — multiline PEM breaks push-secrets.sh update user name and repo
gh secret set SSH_PRIVATE_KEY < coelor.pem --repo tausifo2pi/coelor-website

# push remaining CI secrets
npm run push-ci-secrets
```

---

## 4. One-time EC2 Setup (run once in order)

```bash
cd infra
npm run workflow:transfer
npm run workflow:setup
```

Point domain DNS A record to the EC2 IP, then:

```bash
npm run workflow:ssl
```

---

## 5. Deploy

```bash
git push origin main      
```

Or manually:

```bash
cd infra && npm run workflow:deploy
```

---

## Day-to-day Commands

All infra commands run from the `infra/` directory.

| Command | What it does |
|---------|-------------|
| `cd infra && npm run push-secrets` | Sync `.env` → GitHub Secrets |
| `cd infra && npm run push-ci-secrets` | Sync `.env.ci` → GitHub Secrets |
| `cd infra && npm run workflow:deploy` | Manually trigger build + deploy |
| `cd infra && npm run workflow:transfer` | Re-upload server config files to EC2 |
| `cd infra && npm run workflow:ssl` | Regenerate SSL cert |
| `cd infra && npm run workflow:renew-ssl` | Manually renew SSL cert |
| `cd infra && npm run workflow:setup` | Re-run Docker install on EC2 |
| `git push origin main` | Auto-triggers full deploy pipeline |

---

## Adding a New Environment Variable

```bash
echo "NEW_VAR=value" >> .env
cd infra && npm run push-secrets
# add to ci.yml: echo "NEW_VAR=${{ secrets.NEW_VAR }}" >> .env
git add . && git commit -m "add NEW_VAR" && git push
```

---

## Re-provisioning (replace EC2)

```bash
cd infra
pulumi destroy
pulumi up

gh secret set SSH_PRIVATE_KEY < coelor.pem --repo your-user/your-repo
# update API_SERVER in ../.env.ci with new IP
npm run push-ci-secrets

npm run workflow:transfer
npm run workflow:setup
npm run workflow:ssl
git push origin main
```

---

## SSL Renewal

Auto-runs 1st of every month. Manual trigger:

```bash
cd infra && npm run workflow:renew-ssl
```
