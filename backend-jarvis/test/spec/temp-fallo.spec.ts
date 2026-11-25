// Archivo temporal para ver el comentario del CI cuando la suite falla.
// Se borra después de la prueba. No debe mergearse.
describe('Demo de fallo', () => {
  it('falla a propósito', () => {
    expect(1).toBe(2);
  });

  it('pasa a propósito', () => {
    expect(1).toBe(1);
  });
});
