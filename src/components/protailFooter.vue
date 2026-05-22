<template>
  <footer class="footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4 relative z-40">
    <aside>
      <p>
        Copyright © {{ new Date().getFullYear() }} 苗栗縣立體育場
        ｜<RouterLink to="/terms" class="link link-hover">服務條款</RouterLink>
        ｜<RouterLink to="/privacy" class="link link-hover">隱私權政策</RouterLink>
        ｜<RouterLink to="/admin/login" class="link link-hover">管理登入</RouterLink>
      </p>
    </aside>
  </footer>
</template>