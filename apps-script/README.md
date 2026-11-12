# Menghubungkan RSVP dan ucapan ke Google Sheets

1. Buat atau buka Google Sheets untuk menyimpan RSVP dan ucapan.
2. Pilih **Extensions > Apps Script**, lalu ganti isi `Code.gs` dengan kode dari file [Code.gs](./Code.gs). Simpan project.
3. Pilih **Deploy > New deployment**. Pilih jenis **Web app**, atur **Execute as** ke akun Anda, dan **Who has access** ke **Anyone**, lalu deploy dan setujui izin yang diminta Google.
4. Salin URL Web app yang berakhiran `/exec`.
5. Buka `js/script.js` dan tempel URL tersebut sebagai nilai `wishesApiUrl`, misalnya:

   ```js
   const wishesApiUrl = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec";
   ```

6. Muat ulang situs dan kirim percobaan RSVP serta ucapan. Tab `RSVP` dan `Ucapan` akan dibuat otomatis di spreadsheet. Perubahan kode Apps Script setelah deploy perlu dipublikasikan sebagai versi deployment baru; jika URL deployment berubah, perbarui `wishesApiUrl`.

Web app dapat diakses publik agar situs bisa menyimpan RSVP dan membaca/menambahkan ucapan. Endpoint hanya memeriksa status penyimpanan RSVP, bukan mengirimkan daftar RSVP ke pengunjung. Jangan ubah akses spreadsheet menjadi publik dan jangan simpan informasi rahasia di dalamnya.
