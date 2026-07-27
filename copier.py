from pathlib import Path
import shutil

source_dir = Path("./src")
dest_dir = Path("./backup_project")

dest_dir.mkdir(parents=True, exist_ok=True)

# Find and copy all .tsx files
for file_path in source_dir.rglob("*.ts"):
    if file_path.is_file():
        destination_path = dest_dir / file_path.name
        shutil.copy2(file_path, destination_path)
        print(f"Copied: {file_path.name}")