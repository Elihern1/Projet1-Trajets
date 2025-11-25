import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerTitleAlign: 'center',
      }}
    >
      {/* 1) Trajets (page principale) */}
      <Drawer.Screen
        name="trips/index"
        options={{
          title: 'Trajets',
        }}
      />

      {/* 2) Ajouter un trajet */}
      <Drawer.Screen
        name="trips/new"
        options={{
          title: 'Ajouter un trajet',
        }}
      />

      {/* 3) Paramètres */}
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Paramètres',
        }}
      />

      {/* 4) Version de l’application */}
      <Drawer.Screen
        name="version"
        options={{
          title: "Version de l'application",
        }}
      />

      {/* Écrans "internes" qu’on ne veut PAS voir dans le menu */}
      <Drawer.Screen
        name="trips/details"
        options={{
          title: 'Détails du trajet',
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="change-password"
        options={{
          title: 'Changer le mot de passe',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}