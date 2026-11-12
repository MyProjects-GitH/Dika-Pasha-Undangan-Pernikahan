# Menghubungkan ucapan ke Google Sheets

1. Buat atau buka Google Sheets untuk menyimpan ucapan.
2. Pilih **Extensions > Apps Script**, lalu ganti isi `Code.gs` dengan kode dari file [Code.gs](./Code.gs). Simpan project.
3. Pilih **Deploy > New deployment**. Pilih jenis **Web app**, atur **Execute as** ke akun Anda, dan **Who has access** ke **Anyone**, lalu deploy dan setujui izin yang diminta Google.
4. Salin URL Web app yang berakhiran `/exec`.
5. Buka `js/script.js` dan tempel URL tersebut sebagai nilai `wishesApiUrl`, misalnya:

   ```js
   const wishesApiUrl = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec";
   ```

6. Muat ulang situs dan kirim ucapan percobaan. Tab `Ucapan` akan dibuat otomatis di spreadsheet. Perubahan kode Apps Script setelah deploy perlu dipublikasikan sebagai versi deployment baru.

Web app dapat diakses publik agar situs bisa membaca dan menambahkan ucapan. Jangan simpan informasi rahasia di spreadsheet ini.
