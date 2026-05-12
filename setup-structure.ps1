# setup-structure.ps1
# Jalankan script ini dari folder: C:\IT Inventory Management\
# Perintah: .\setup-structure.ps1

Write-Host "🚀 Menyusun struktur folder IT Inventory Management..." -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────────
# BUAT SEMUA FOLDER YANG DIBUTUHKAN
# ─────────────────────────────────────────────────────────────
$folders = @(
    "app\riwayat",
    "components\dashboard\widgets",
    "components\modal",
    "components\ui",
    "hooks",
    "lib",
    "types"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✅ Dibuat: $folder" -ForegroundColor Green
    } else {
        Write-Host "  ⏭  Ada: $folder" -ForegroundColor Gray
    }
}

# ─────────────────────────────────────────────────────────────
# PINDAHKAN FILE DARI ROOT KE LOKASI YANG BENAR
# File-file ini mungkin ter-download langsung ke root folder
# ─────────────────────────────────────────────────────────────
$moves = @(
    # Format: @("nama_file_di_root", "tujuan_folder\nama_file_tujuan")

    # app/
    @("globals",       "app\globals.css"),
    @("globals.css",   "app\globals.css"),

    # types/
    @("inventory",     "types\inventory.ts"),
    @("inventory.ts",  "types\inventory.ts"),

    # lib/
    @("api",           "lib\api.ts"),
    @("api.ts",        "lib\api.ts"),
    @("utils",         "lib\utils.ts"),
    @("utils.ts",      "lib\utils.ts"),
    @("exportExcel",   "lib\exportExcel.ts"),
    @("exportExcel.ts","lib\exportExcel.ts"),

    # hooks/
    @("useInventory",              "hooks\useInventory.ts"),
    @("useInventory.ts",           "hooks\useInventory.ts"),
    @("useTransactionHistory",     "hooks\useTransactionHistory.ts"),
    @("useTransactionHistory.ts",  "hooks\useTransactionHistory.ts"),

    # components/dashboard/
    @("DashboardPage",    "components\dashboard\DashboardPage.tsx"),
    @("DashboardPage.tsx","components\dashboard\DashboardPage.tsx"),
    @("InventoryTable",   "components\dashboard\InventoryTable.tsx"),
    @("InventoryTable.tsx","components\dashboard\InventoryTable.tsx"),
    @("Sidebar",          "components\dashboard\Sidebar.tsx"),
    @("Sidebar.tsx",      "components\dashboard\Sidebar.tsx"),
    @("TransactionHistoryPage",    "components\dashboard\TransactionHistoryPage.tsx"),
    @("TransactionHistoryPage.tsx","components\dashboard\TransactionHistoryPage.tsx"),

    # components/dashboard/widgets/
    @("index",    "components\dashboard\widgets\index.tsx"),
    @("index.tsx","components\dashboard\widgets\index.tsx"),

    # components/modal/
    @("StockOutModal",    "components\modal\StockOutModal.tsx"),
    @("StockOutModal.tsx","components\modal\StockOutModal.tsx")
)

Write-Host "`n📦 Memindahkan file ke lokasi yang benar..." -ForegroundColor Cyan

foreach ($move in $moves) {
    $src  = $move[0]
    $dest = $move[1]

    if (Test-Path $src) {
        # Pastikan folder tujuan ada
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }

        # Jangan timpa file yang sudah benar
        if (Test-Path $dest) {
            Write-Host "  ⏭  Skip (sudah ada): $dest" -ForegroundColor Gray
        } else {
            Move-Item -Path $src -Destination $dest -Force
            Write-Host "  ✅ Dipindahkan: $src → $dest" -ForegroundColor Green
        }
    }
}

# ─────────────────────────────────────────────────────────────
# VERIFIKASI FILE PENTING
# ─────────────────────────────────────────────────────────────
Write-Host "`n🔍 Verifikasi file penting..." -ForegroundColor Cyan

$required = @(
    "app\globals.css",
    "app\layout.tsx",
    "app\page.tsx",
    "app\riwayat\page.tsx",
    "components\dashboard\DashboardPage.tsx",
    "components\dashboard\InventoryTable.tsx",
    "components\dashboard\Sidebar.tsx",
    "components\dashboard\TransactionHistoryPage.tsx",
    "components\dashboard\widgets\index.tsx",
    "components\modal\StockOutModal.tsx",
    "components\ui\button.tsx",
    "components\ui\dialog.tsx",
    "components\ui\input.tsx",
    "components\ui\label.tsx",
    "hooks\useInventory.ts",
    "hooks\useTransactionHistory.ts",
    "lib\api.ts",
    "lib\utils.ts",
    "lib\exportExcel.ts",
    "types\inventory.ts",
    "tailwind.config.ts",
    "postcss.config.js",
    "tsconfig.json",
    "next.config.js",
    "package.json"
)

$missing = @()
foreach ($file in $required) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ TIDAK ADA: $file" -ForegroundColor Red
        $missing += $file
    }
}

# ─────────────────────────────────────────────────────────────
# RINGKASAN
# ─────────────────────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
if ($missing.Count -eq 0) {
    Write-Host "✅ Semua file sudah di tempat yang benar!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Langkah selanjutnya:" -ForegroundColor Yellow
    Write-Host "  1. npx shadcn@latest add button dialog input label" -ForegroundColor White
    Write-Host "  2. npm install" -ForegroundColor White
    Write-Host "  3. rd /s /q .next" -ForegroundColor White
    Write-Host "  4. npm run dev" -ForegroundColor White
} else {
    Write-Host "⚠️  $($missing.Count) file masih kurang:" -ForegroundColor Yellow
    foreach ($f in $missing) {
        Write-Host "   - $f" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Download file yang kurang dari Claude, lalu:" -ForegroundColor Yellow
    Write-Host "  Letakkan di folder yang sesuai (lihat daftar di atas)" -ForegroundColor White
}
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
