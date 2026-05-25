const bannerModules = import.meta.glob("../img/banner/*.{png,jpg,jpeg,webp,gif,svg}", {
    eager: true,
  });
  export const bannerList = Object.values(bannerModules).map(mod => mod.default);