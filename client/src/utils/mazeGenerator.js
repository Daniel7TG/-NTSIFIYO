export const getMazeDimensions = (difficulty) => {
    switch (difficulty) {
        case 'Fácil':
            return { width: 5, height: 5 };
        case 'Difícil':
            return { width: 10, height: 10 };
        case 'Medio':
        default:
            return { width: 7, height: 7 };
    }
};

export const generateMaze = (width, height) => {
    // 1. Inicializar el grid con todas las paredes
    const grid = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push({
                x,
                y,
                top: true,
                right: true,
                bottom: true,
                left: true,
                visited: false,
                // Agregaremos propiedades extra para colocar las cartas posteriormente si es necesario
            });
        }
        grid.push(row);
    }

    // 2. Elegir una celda de inicio al azar
    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    
    let current = grid[startY][startX];
    current.visited = true;
    const stack = [];

    // Helper para obtener vecinos no visitados
    const getUnvisitedNeighbors = (cell) => {
        const neighbors = [];
        const { x, y } = cell;

        if (y > 0 && !grid[y - 1][x].visited) neighbors.push({ dir: 'top', cell: grid[y - 1][x] });
        if (x < width - 1 && !grid[y][x + 1].visited) neighbors.push({ dir: 'right', cell: grid[y][x + 1] });
        if (y < height - 1 && !grid[y + 1][x].visited) neighbors.push({ dir: 'bottom', cell: grid[y + 1][x] });
        if (x > 0 && !grid[y][x - 1].visited) neighbors.push({ dir: 'left', cell: grid[y][x - 1] });

        return neighbors;
    };

    // Helper para remover paredes entre dos celdas adyacentes
    const removeWalls = (currentCell, nextCell, dir) => {
        if (dir === 'top') {
            currentCell.top = false;
            nextCell.bottom = false;
        } else if (dir === 'right') {
            currentCell.right = false;
            nextCell.left = false;
        } else if (dir === 'bottom') {
            currentCell.bottom = false;
            nextCell.top = false;
        } else if (dir === 'left') {
            currentCell.left = false;
            nextCell.right = false;
        }
    };

    // 3. Recursive Backtracker (DFS)
    do {
        const neighbors = getUnvisitedNeighbors(current);

        if (neighbors.length > 0) {
            // Escoger vecino al azar
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            // Push actual al stack
            stack.push(current);
            
            // Remover paredes
            removeWalls(current, randomNeighbor.cell, randomNeighbor.dir);
            
            // Moverse al vecino
            current = randomNeighbor.cell;
            current.visited = true;
        } else if (stack.length > 0) {
            // Retroceder si no hay vecinos
            current = stack.pop();
        }
    } while (stack.length > 0 || getUnvisitedNeighbors(current).length > 0); 
    // Wait, the loop condition for strict DFS should just be while(stack.length > 0), because when stack is empty, we are back at the start and all reachable have been visited.

    return grid;
};
