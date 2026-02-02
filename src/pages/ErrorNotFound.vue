<template>
  <div class="notfound">
    <div class="notfound__card">
      <img
        :src="logoUrl"
        alt="Menarini"
        class="notfound__logo"
        loading="lazy"
      />

      <div class="notfound__code">404</div>
      <div class="notfound__title">Pagina non trovata</div>
      <p class="notfound__text">
        La pagina che stai cercando potrebbe essere stata spostata o rimossa.
        Controlla l'URL o torna alla home per continuare.
      </p>

      <div class="notfound__actions">
        <q-btn
          class="notfound__btn"
          color="primary"
          unelevated
          to="/"
          label="Torna alla home"
          no-caps
        />
        <q-btn
          class="notfound__btn"
          color="primary"
          outline
          @click="goBack"
          label="Torna indietro"
          no-caps
        />
      </div>

      <div class="notfound__hint">
        Se il problema persiste, contatta il nostro team.
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import logoUrl from 'assets/menarini.svg'

const router = useRouter()
const goBack = () => router.back()

defineOptions({
  name: 'ErrorNotFound'
})
</script>

<style scoped>
.notfound {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #0f172a;
  background:
    radial-gradient(1200px 600px at 15% 10%, rgba(232, 43, 59, 0.16), transparent 55%),
    radial-gradient(900px 500px at 85% 15%, rgba(15, 118, 110, 0.16), transparent 60%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
  position: relative;
  overflow: hidden;
}

.notfound::before {
  content: "";
  position: absolute;
  inset: -20% 0 auto 0;
  height: 360px;
  background: linear-gradient(120deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0));
  transform: rotate(-6deg);
  pointer-events: none;
}

.notfound__card {
  position: relative;
  width: min(640px, 100%);
  padding: 40px 36px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.08),
    0 6px 14px rgba(15, 23, 42, 0.06);
  text-align: center;
}

.notfound__logo {
  width: 140px;
  height: auto;
  margin: 0 auto 20px;
  display: block;
}

.notfound__code {
  font-size: clamp(72px, 14vw, 160px);
  line-height: 0.9;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #e82b3b;
}

.notfound__title {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 600;
  margin-top: 8px;
}

.notfound__text {
  margin: 12px auto 0;
  max-width: 480px;
  font-size: 16px;
  line-height: 1.6;
  color: #475569;
}

.notfound__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.notfound__btn {
  min-width: 180px;
}

.notfound__hint {
  margin-top: 20px;
  font-size: 14px;
  color: #94a3b8;
}

@media (max-width: 520px) {
  .notfound__card {
    padding: 32px 24px;
  }

  .notfound__btn {
    width: 100%;
  }
}
</style>
