import React from 'react';
import styles from './DashboardCard.module.css';
import { getTrendIcon } from './utils/Utils';

const DashboardCard = ({
  icon,
  iconName,
  iconBackground,
  color = null,
  title,
  trend = null,
  value,
  variant = 'default',
}) => {
  const isAlert = variant === 'alert';
  const iconContent =
    iconName != null ? (
      <span className={`material-symbols-outlined text-[${color}]`}>
        {iconName}
      </span>
    ) : (
      icon
    );

  return (
    <div className={`${styles.card}`}>
      {iconContent && variant == 'default' && (
        <div className={`absolute -bottom-5 -right-6`}>
          <span className={`${styles.size36} material-symbols-outlined`}>
            {iconName}
          </span>
        </div>
      )}

      <div className={styles.header}>
        <p className={styles.title}>{title}</p>
        <div className={styles.headerRight}>
          <div
            className={`${styles.iconWrapper} ${isAlert ? styles.iconWrapperAlert : ''}`}
            style={
              !isAlert && iconBackground
                ? { backgroundColor: iconBackground, color: '#F37021' }
                : undefined
            }
          >
            {iconContent}
          </div>
        </div>
      </div>
      <h3 className={`${styles.value} ${isAlert ? styles.valueAlert : ''}`}>
        {value}
      </h3>
      {trend != null && (
        <div className={styles.trend}>{getTrendIcon({ trend })}</div>
      )}
    </div>
  );
};

export default DashboardCard;
