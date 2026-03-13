import React, { useEffect, useState, useRef } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import "./App.css";

// Componente zona droppable
function Zone({ id, children, style, setHoveredCard, onDrop }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="zone"
      style={style}
      onMouseEnter={() => setHoveredCard(null)}
    >
      <span>{children}</span>
    </div>
  );
}

// Componente carta draggable (igual que antes)
function DraggableCard({ card, updatePosition, boardRef, setHovered, zonesPositions }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: card.id });

  const style = {
    position: "absolute",
    left: card.x,
    top: card.y,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: transform ? 1000 : undefined,
  };

  const handleMouseUp = (event) => {
  if (!boardRef.current) return;

  const rect = boardRef.current.getBoundingClientRect();
  const cursorX = event.clientX - rect.left;
  const cursorY = event.clientY - rect.top;

  // Calculamos la zona más cercana
  let closestZone = null;
  let minDistance = Infinity;

 Object.entries(zonesPositions).forEach(([zoneId, zone]) => {
  if (zoneId === "battlefield") return; // 🔹 ignoramos el battlefield

  const centerX = zone.left + zone.width / 2;
  const centerY = zone.top + zone.height / 2;
  const distance = Math.hypot(centerX - cursorX, centerY - cursorY);
  if (distance < minDistance) {
    minDistance = distance;
    closestZone = zone;
  }
  });

  if (closestZone) {
    // Snap al centro de la zona
    updatePosition(card.id, closestZone.left + closestZone.width / 2 - 75, closestZone.top + closestZone.height / 2 - 105);
  }
};

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="card-wrapper"
      style={style}
      onMouseEnter={() => setHovered(card.id)}
      onMouseLeave={() => setHovered(null)}
      onMouseUp={handleMouseUp}
    >
      <img src={card.image} alt={card.name} className="card" style={{ width: "150px" }} />
    </div>
  );
}

// App principal
function App() {
  const boardRef = useRef(null);
  const [cards, setCards] = useState([]);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  useEffect(() => {
    async function fetchCard() {
      const response = await fetch(
        "https://api.scryfall.com/cards/named?exact=Sol Ring"
      );
      const data = await response.json();
      setCards([
        {
          id: data.id,
          name: data.name,
          image: data.image_uris.normal,
          x: 100,
          y: 100,
        },
      ]);
    }
    fetchCard();
  }, []);

  const zonesPositions = {
    commander: { left: boardRef.current ? boardRef.current.offsetWidth/2 - 80 : 0, top: 20, width: 160, height: 220 },
    battlefield: { left: boardRef.current ? boardRef.current.offsetWidth*0.1 : 0, top: 260, width: boardRef.current ? boardRef.current.offsetWidth*0.8 : 0, height: 300 },
    graveyard: { left: boardRef.current ? boardRef.current.offsetWidth - 320 : 0, top: boardRef.current ? boardRef.current.offsetHeight - 200 : 0, width: 120, height: 180 },
    exile: { left: boardRef.current ? boardRef.current.offsetWidth - 140 : 0, top: boardRef.current ? boardRef.current.offsetHeight - 200 : 0, width: 120, height: 180 },
    library: { left: 20, top: boardRef.current ? boardRef.current.offsetHeight - 200 : 0, width: 120, height: 180 },
  };

  const updateCardPosition = (id, x, y) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c))
    );
  };

  return (
    <DndContext>
      <div className="game-board" ref={boardRef}>
        {/* Zonas */}
        <Zone id="commander" style={{ top: 20, left: "50%", transform: "translateX(-50%)", width: 160, height: 220 }} setHoveredCard={setHoveredCardId}>
          Comandante
        </Zone>

        <Zone id="battlefield" style={{ top: 260, left: "50%", transform: "translateX(-50%)", width: "80%", height: 300 }} setHoveredCard={setHoveredCardId}>
          Campo de batalla
        </Zone>

        <Zone id="graveyard" style={{ bottom: 20, right: 200, width: 120, height: 180 }} setHoveredCard={setHoveredCardId}>
          Cementerio
        </Zone>

        <Zone id="exile" style={{ bottom: 20, right: 20, width: 120, height: 180 }} setHoveredCard={setHoveredCardId}>
          Exilio
        </Zone>

        <Zone id="library" style={{ bottom: 20, left: 20, width: 120, height: 180 }} setHoveredCard={setHoveredCardId}>
          Mazo
        </Zone>

        {/* Cartas */}
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            updatePosition={updateCardPosition}
            boardRef={boardRef}
            setHovered={setHoveredCardId}
            zonesPositions={zonesPositions}
          />
        ))}

        {/* Preview derecho */}
        {hoveredCardId && (
          <div className="card-zoom">
            <img
              src={cards.find((c) => c.id === hoveredCardId).image}
              alt={cards.find((c) => c.id === hoveredCardId).name}
            />
          </div>
        )}
      </div>
    </DndContext>
  );
}

export default App;