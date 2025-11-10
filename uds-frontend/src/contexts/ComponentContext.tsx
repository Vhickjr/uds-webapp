import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Component {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  status: "available" | "checked-out" | "low-stock";
}

export interface CheckoutRecord {
  id: string;
  componentId: string;
  componentName: string;
  userName: string;
  quantity: number;
  checkoutDate: string;
  expectedReturn: string;
  returned: boolean;
  // when a user requests a return, admin must approve to finalize
  returnRequested?: boolean;
}

interface ComponentContextType {
  components: Component[];
  checkoutHistory: CheckoutRecord[];
  addComponent: (component: Omit<Component, "id" | "available" | "status">) => void;
  updateComponent: (id: string, component: Partial<Component>) => void;
  deleteComponent: (id: string) => void;
  checkoutComponent: (componentId: string, userName: string, quantity: number, expectedReturn: string) => void;
  returnComponent: (checkoutId: string) => void;
  requestReturn: (checkoutId: string) => void;
  clearReturnRequest: (checkoutId: string) => void;
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

const initialComponents: Component[] = [
  { id: "1", name: "Resistor 1kΩ", category: "Resistors", quantity: 100, available: 85, status: "available" },
  { id: "2", name: "Capacitor 10µF", category: "Capacitors", quantity: 50, available: 12, status: "low-stock" },
  { id: "3", name: "Arduino Uno", category: "Microcontrollers", quantity: 10, available: 4, status: "checked-out" },
  { id: "4", name: "LED Red 5mm", category: "LEDs", quantity: 200, available: 180, status: "available" },
  { id: "5", name: "555 Timer IC", category: "ICs", quantity: 30, available: 25, status: "available" },
  { id: "6", name: "Breadboard", category: "Tools", quantity: 15, available: 8, status: "checked-out" },
];

const updateComponentStatus = (component: Component): Component => {
  const percentageAvailable = (component.available / component.quantity) * 100;
  let status: Component["status"] = "available";
  
  if (component.available === 0) {
    status = "checked-out";
  } else if (percentageAvailable < 30) {
    status = "low-stock";
  } else if (component.available < component.quantity) {
    status = "checked-out";
  }
  
  return { ...component, status };
};

export const ComponentProvider = ({ children }: { children: ReactNode }) => {
  const [components, setComponents] = useState<Component[]>(() => {
    try {
      const raw = localStorage.getItem('uds_components');
      return raw ? JSON.parse(raw) as Component[] : initialComponents;
    } catch (e) {
      return initialComponents;
    }
  });

  const [checkoutHistory, setCheckoutHistory] = useState<CheckoutRecord[]>(() => {
    try {
      const raw = localStorage.getItem('uds_checkoutHistory');
      return raw ? JSON.parse(raw) as CheckoutRecord[] : [];
    } catch (e) {
      return [];
    }
  });

  // persist to localStorage for frontend-only demo (survives reloads)
  useEffect(() => {
    try { localStorage.setItem('uds_components', JSON.stringify(components)); } catch (e) {}
  }, [components]);

  useEffect(() => {
    try { localStorage.setItem('uds_checkoutHistory', JSON.stringify(checkoutHistory)); } catch (e) {}
  }, [checkoutHistory]);

  const addComponent = (componentData: Omit<Component, "id" | "available" | "status">) => {
    const newComponent: Component = {
      ...componentData,
      id: Date.now().toString(),
      available: componentData.quantity,
      status: "available",
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (id: string, updates: Partial<Component>) => {
    setComponents(components.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        return updateComponentStatus(updated);
      }
      return c;
    }));
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const checkoutComponent = (componentId: string, userName: string, quantity: number, expectedReturn: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    const checkoutRecord: CheckoutRecord = {
      id: Date.now().toString(),
      componentId,
      componentName: component.name,
      userName,
      quantity,
      checkoutDate: new Date().toISOString().split('T')[0],
      expectedReturn,
      returned: false,
    };

    setCheckoutHistory([checkoutRecord, ...checkoutHistory]);
    
    const newAvailable = component.available - quantity;
    updateComponent(componentId, { available: newAvailable });
  };

  const returnComponent = (checkoutId: string) => {
    const checkout = checkoutHistory.find(c => c.id === checkoutId);
    if (!checkout) return;

    setCheckoutHistory(checkoutHistory.map(c => 
      c.id === checkoutId ? { ...c, returned: true } : c
    ));

    const component = components.find(c => c.id === checkout.componentId);
    if (component) {
      const newAvailable = Math.min(component.available + checkout.quantity, component.quantity);
      updateComponent(checkout.componentId, { available: newAvailable });
    }
  };

  const requestReturn = (checkoutId: string) => {
    setCheckoutHistory(checkoutHistory.map(c =>
      c.id === checkoutId ? { ...c, returnRequested: true } : c
    ));
  };

  const clearReturnRequest = (checkoutId: string) => {
    setCheckoutHistory(checkoutHistory.map(c =>
      c.id === checkoutId ? { ...c, returnRequested: false } : c
    ));
  };

  return (
    <ComponentContext.Provider
      value={{
        components,
        checkoutHistory,
        addComponent,
        updateComponent,
        deleteComponent,
        checkoutComponent,
          returnComponent,
          requestReturn,
          clearReturnRequest,
      }}
    >
      {children}
    </ComponentContext.Provider>
  );
};

export const useComponents = () => {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error("useComponents must be used within ComponentProvider");
  }
  return context;
};
