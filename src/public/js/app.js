document.addEventListener("click", (event) => {
  const thumb = event.target.closest("[data-gallery-thumb]");
  if (!thumb) return;
  const main = document.getElementById("mainProductImage");
  if (!main) return;

  main.src = thumb.dataset.src;
  main.alt = thumb.dataset.alt || main.alt;
  document.querySelectorAll("[data-gallery-thumb]").forEach((el) => el.classList.remove("is-active"));
  thumb.classList.add("is-active");
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;
  const select = form.querySelector("[data-delivery-type]");
  const addressWrap = form.querySelector("[data-delivery-address-wrap]");
  const textarea = addressWrap?.querySelector("textarea");

  const sync = () => {
    const isDelivery = select.value === "Delivery";
    addressWrap.classList.toggle("is-hidden", !isDelivery);
    if (textarea) textarea.required = isDelivery;
  };

  sync();
  select.addEventListener("change", sync);
});

