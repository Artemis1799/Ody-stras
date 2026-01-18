import { Strings } from "../../types/strings";

/**
 * Convertit un statut d'événement en son alias français pour l'affichage.
 * Cette fonction ne modifie PAS la valeur en base de données, uniquement l'affichage.
 * 
 * @param status - Le statut technique (toOrganize, inProgress, completed, etc.)
 * @returns Le libellé français correspondant
 */
export const getEventStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
        toOrganize: Strings.eventStatus.toOrganize,
        inProgress: Strings.eventStatus.inProgress,
        installation: Strings.eventStatus.installation,
        uninstallation: Strings.eventStatus.uninstallation,
        completed: Strings.eventStatus.completed,
    };

    return statusMap[status] || status;
};
