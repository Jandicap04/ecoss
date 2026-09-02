# ECHO LOOP

Prototipo web jugable de supervivencia temporal. Mueve el círculo con el ratón o el dedo y evita los ecos que repiten tus movimientos cinco segundos después.

## Ejecutar

```bash
npm install
npm run dev
```

Abre la URL local que muestre Vite. Para comprobar la compilación de producción:

```bash
npm run build
```

## Controles y reglas

- Arrastra o mueve el puntero dentro del área de juego.
- Aparece un eco cada 10 segundos.
- Si un eco toca al jugador, la partida termina.
- Los ecos pueden chocar entre sí y desaparecer en una explosión.
- Cada 20 segundos puedes elegir una mutación.
- El récord se guarda en el navegador.
