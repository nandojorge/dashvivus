// ... (código anterior)

  // Define origins in lowercase for consistency
  const origins = ["website", "referral", "social media", "email marketing", "direct"];

  const processContactsForPeriod = (allContacts: Contact[] | undefined, periodFilterFn: (contactDate: Date) => boolean) => {
    if (!allContacts) return [];
    return allContacts.filter((contact) => {
      let itemDateString: string | undefined;
      if ('dataregisto' in contact) {
        itemDateString = contact.dataregisto;
      }

      if (!itemDateString || typeof itemDateString !== 'string') {
        return false;
      }
      const itemDate = parseISO(itemDateString);
      if (isNaN(itemDate.getTime())) {
        console.warn(`Invalid date string for item ${contact.id}: ${itemDateString}`);
        return false;
      }
      return periodFilterFn(itemDate);
    }).map((contact) => {
      let assignedOrigin = contact.origemcontacto ? contact.origemcontacto.toLowerCase() : '';
      if (!assignedOrigin || !origins.includes(assignedOrigin)) { // Ensure assigned origin is one of the defined ones
        assignedOrigin = origins[Math.floor(Math.random() * origins.length)]; // <-- AQUI É ONDE A ORIGEM É ATRIBUÍDA ALEATORIAMENTE
      }

      return {
        ...contact,
        origemcontacto: assignedOrigin,
      };
    });
  };

// ... (código posterior)