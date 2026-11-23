UPDATE guia_fotos AS gf
INNER JOIN guias AS g ON g.id = gf.guia_id
SET gf.ruta_archivo = 'img/guias/lia-viento-de-huasca.png'
WHERE g.nombre = 'Lía Viento de Huasca'
  AND gf.ruta_archivo IN ('img/guias/guia-1.jpg', 'img/guias/guia-1.png');

UPDATE guia_fotos AS gf
INNER JOIN guias AS g ON g.id = gf.guia_id
SET gf.ruta_archivo = 'img/guias/elian-bosque-chico.png'
WHERE g.nombre = 'Elian Bosque Chico'
  AND gf.ruta_archivo IN ('img/guias/guia-2.jpg', 'img/guias/guia-2.png');

UPDATE guia_fotos AS gf
INNER JOIN guias AS g ON g.id = gf.guia_id
SET gf.ruta_archivo = 'img/guias/mara-mina-serena.png'
WHERE g.nombre = 'Mara Mina Serena'
  AND gf.ruta_archivo IN ('img/guias/guia-3.jpg', 'img/guias/guia-3.png');
