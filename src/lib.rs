mod utils;
use std::fmt;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead = 0,
    Alive = 1,
}

impl Cell {
    fn toogle(&mut self) {
        *self = match *self {
            Cell::Alive => Cell::Dead,
            Cell::Dead => Cell::Alive
        };
    }
}


#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
}

#[wasm_bindgen]
impl Universe {
    pub fn new() -> Universe {
        let width = 30;
        let height = 30;

        let cells = (0..width * height)
            .map(|i| {
                if js_sys::Math::random() < 0.5 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect();

        Universe {
            width,
            height,
            cells,
        }
    }

    pub fn render(&self) -> String {
        self.to_string()
    }

    pub fn width(&self) -> u32 {self.width}

    pub fn height(&self) -> u32 {self.height}

    pub fn cells(&self) -> *const Cell {self.cells.as_ptr()}

    pub fn toogle_cell(&mut self, row: u32, col: u32) {
        let idx = self.get_index(row, col);
        self.cells[idx].toogle()
    }

    fn get_index(&self, row: u32, col: u32) -> usize {
        return (row * self.width + col) as usize;
    }

    fn live_neighbor_count(&self, row: u32, col: u32) -> u8 {
        let mut count: u8 = 0;


        for dr in [self.height - 1, 1].iter().clone() {
            let n_row = (row + dr) % self.height;
            let mut hex_offset= 0;

            match row % 2 {
                0 => hex_offset = col - 1,
                _ => hex_offset = col + 1,
            };

            count += self.cells[self.get_index(n_row, col)] as u8;
            count += self.cells[self.get_index(n_row, (hex_offset) % self.width)] as u8;
        }

        for dc in [self.width - 1, 1].iter().clone() {
            count += self.cells[self.get_index(row, (col + dc) % self.width)] as u8;
        }

        count
    }

    pub fn tick(&mut self) {
        let mut next = self.cells.clone();

        for row in 0..self.height {
            for col in 0..self.width {
                let idx = self.get_index(row, col);
                let cell = self.cells[idx];
                let live_neighbors = self.live_neighbor_count(row, col);

                let next_cell = match (cell, live_neighbors) {
                    // Rule 1: Any live cell with fewer than two live neighbours
                    // dies, as if caused by underpopulation.
                    (Cell::Alive, x) if x < 2 => Cell::Dead,
                    // Rule 2: Any live cell with two or three live neighbours
                    // lives on to the next generation.
                    (Cell::Alive, 2) | (Cell::Alive, 3) => Cell::Alive,
                    // Rule 3: Any live cell with more than three live
                    // neighbours dies, as if by overpopulation.
                    (Cell::Alive, x) if x > 3 => Cell::Dead,
                    // Rule 4: Any dead cell with exactly three live neighbours
                    // becomes a live cell, as if by reproduction.
                    (Cell::Dead, 3) => Cell::Alive,
                    // All other cells remain in the same state.
                    (otherwise, _) => otherwise,
                };

                next[idx] = next_cell;
            }
        }

        self.cells = next;
    }
}



impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        for (idx,line) in self.cells.as_slice().chunks(self.width as usize).enumerate() {
            if idx % 2 == 0 {
                write!(f, " ",)?
            }

            for &cell in line {
                let symbol = if cell == Cell::Dead { '⬡' } else { '⬢' };
                write!(f, "{} ", symbol)?;
            }
            write!(f, "\n")?;
        }
        Ok(())
    }
}

