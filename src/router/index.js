import { createRouter, createWebHistory } from "vue-router";

const EmptyView = {
  name: "EmptyView",
  render() {
    return null;
  },
};

const routes = [
  { path: "/", redirect: { name: "trips" } },
  { path: "/trips", name: "trips", component: EmptyView },
  { path: "/trips/new", name: "newTrip", component: EmptyView },
  { path: "/trips/:tripId", name: "checklist", component: EmptyView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
