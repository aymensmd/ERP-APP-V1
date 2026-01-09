import React from 'react';
import { Calendar, Badge } from 'antd';

const VacationCalendar = ({ vacations }) => {
  const getListData = (value) => {
    const date = value.format('YYYY-MM-DD');
    return vacations.filter(vacation => vacation.start_date <= date && vacation.end_date >= date)
      .map(vacation => ({ type: 'success', content: vacation.type }));
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item, index) => (
          <li key={index}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Calendar dateCellRender={dateCellRender} />
  );
};

export default VacationCalendar;
