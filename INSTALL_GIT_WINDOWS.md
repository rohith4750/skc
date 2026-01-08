# Installing Git on Windows

Git is required to push your code to GitHub for deployment.

---

## Option 1: Using Winget (Easiest - Windows 10/11)

1. **Open PowerShell as Administrator**
   - Press `Windows Key + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Run this command:**
   ```powershell
   winget install --id Git.Git -e --source winget
   ```

3. **Restart your terminal** after installation

4. **Verify installation:**
   ```powershell
   git --version
   ```
   Should show: `git version 2.x.x`

---

## Option 2: Download Git Installer (Alternative)

1. **Download Git for Windows**
   - Go to: https://git-scm.com/download/win
   - Download the installer (64-bit)

2. **Run the installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the installation
   - **Recommended settings:**
     - Use Git from the command line: "Git from the command line and also from 3rd-party software"
     - Default editor: Use default (Vim) or choose your preferred editor
     - Line ending conversions: "Checkout Windows-style, commit Unix-style line endings"
     - Click "Install"

3. **Complete installation**
   - Wait for installation to finish
   - Click "Finish"

4. **Restart your terminal/PowerShell**

5. **Verify installation:**
   ```powershell
   git --version
   ```

---

## Option 3: Using Chocolatey (If you have it installed)

```powershell
choco install git -y
```

---

## After Installation

1. **Configure Git** (first time setup):
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. **Verify Git is working:**
   ```powershell
   git --version
   ```

3. **Now you can proceed with deployment:**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   ```

---

## Quick Check

Run this in PowerShell to check if Git is installed:
```powershell
git --version
```

If you see a version number → Git is installed ✅
If you see an error → Git is not installed ❌

---

## Troubleshooting

### Git command not found after installation
- **Solution**: Close and reopen your terminal/PowerShell
- Or restart your computer

### Winget not found
- **Solution**: Use Option 2 (Download installer) instead
- Winget requires Windows 10 version 1809 or later

### Permission errors
- **Solution**: Run PowerShell as Administrator
- Right-click PowerShell → "Run as administrator"

---

After Git is installed, you can continue with the deployment steps!
