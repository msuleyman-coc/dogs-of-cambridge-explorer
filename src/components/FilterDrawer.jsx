import React from 'react';

export default function FilterDrawer({ filters, setFilters }) {
  return (
    <div className="panel" style={{ flex: 1 }}>
      <h3>Filters</h3>
      <div className="scroll">
        <div className="filter-group">
          <label>Dog name</label>
          <input type="text" placeholder="e.g. Bella" value={filters.nameSearch}
            onChange={(e) => setFilters({ ...filters, nameSearch: e.target.value })}/>
        </div>

        <div className="filter-group">
          <label>Breed search</label>
          <input type="text" placeholder="e.g. doodle" value={filters.breedSearch}
            onChange={(e) => setFilters({ ...filters, breedSearch: e.target.value })}/>
        </div>
      </div>
    </div>
  );
}
