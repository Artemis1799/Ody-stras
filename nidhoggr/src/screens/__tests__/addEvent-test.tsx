// Mock des dépendances AVANT les imports
jest.mock("expo-sqlite", () => ({
    useSQLiteContext: jest.fn(),
}));
jest.mock("@react-navigation/native", () => ({
    useNavigation: jest.fn(),
}));
jest.mock("react-native-uuid", () => ({
    v4: jest.fn(),
}));
jest.mock("../../../database/queries", () => ({
    insert: jest.fn(),
}));
jest.mock("@expo/vector-icons", () => ({
    Ionicons: "Ionicons",
}));
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

import React from "react";
import renderer, { act } from "react-test-renderer";
import { CreateEventScreen } from "../addEvent";
import { useSQLiteContext } from "expo-sqlite";
import { useNavigation } from "@react-navigation/native";
import uuid from "react-native-uuid";
import { insert } from "../../../database/queries";
import { TextInput, TouchableOpacity, Text } from "react-native";

// Données de test
const testData = {
    eventNames: ["Événement Test", "Concert", "Conférence", ""],
    descriptions: ["Description test", "Une belle soirée", "", "Description longue avec plusieurs mots"],
    dates: [new Date("2024-01-15"), new Date("2025-12-31"), new Date()],
    uuids: ["uuid-test-1", "uuid-test-2", "uuid-test-3"],
};

describe("CreateEventScreen", () => {
    let mockDb: any;
    let mockNavigation: any;
    let mockInsert: jest.Mock;

    beforeEach(() => {
        // Arrange - Configuration des mocks
        mockDb = {
            runAsync: jest.fn(),
            getFirstAsync: jest.fn(),
            getAllAsync: jest.fn(),
        };
        (useSQLiteContext as jest.Mock).mockReturnValue(mockDb);

        mockNavigation = {
            goBack: jest.fn(),
            navigate: jest.fn(),
        };
        (useNavigation as jest.Mock).mockReturnValue(mockNavigation);

        (uuid.v4 as jest.Mock).mockReturnValue(testData.uuids[0]);

        mockInsert = insert as jest.Mock;
        mockInsert.mockResolvedValue(undefined);

        jest.clearAllMocks();
    });

    describe("Rendu initial", () => {
        it("devrait afficher tous les éléments du formulaire", () => {
            // Arrange - Aucune donnée additionnelle nécessaire
            let tree: any;

            // Act - Rendre le composant
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });

            // Assert - Vérifier la présence des éléments
            const root = tree.root;
            const texts = root.findAllByType(Text);
            const allText = texts.map((t: any) => {
                const children = t.props.children;
                return Array.isArray(children) ? children.join('') : children;
            }).join(' ');

            expect(allText).toContain("Nom d");
            expect(allText).toContain("événement");
            expect(allText).toContain("Description");
            expect(allText).toContain("Date de début");
            expect(allText).toContain("Valider");

            const inputs = root.findAllByType(TextInput);
            expect(inputs[0].props.placeholder).toBe("Entrez le nom...");
            expect(inputs[1].props.placeholder).toBe("Entrez une description...");
        }); it("devrait afficher la date actuelle par défaut", () => {
            // Arrange - Date actuelle
            const today = new Date();
            const expectedDate = today.toLocaleDateString("fr-FR");
            let tree: any;

            // Act - Rendre le composant
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });

            // Assert - Vérifier l'affichage de la date
            const root = tree.root;
            const texts = root.findAllByType(Text);
            const textContents = texts.map((t: any) => t.props.children);
            expect(textContents).toContain(expectedDate);
        });

        it("devrait avoir des champs vides au départ", () => {
            // Arrange - Aucune donnée pré-remplie
            let tree: any;

            // Act - Rendre le composant
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });

            // Assert - Vérifier que les champs sont vides
            const root = tree.root;
            const inputs = root.findAllByType(TextInput);
            expect(inputs[0].props.value).toBe("");
            expect(inputs[1].props.value).toBe("");
        });
    });

    describe("Interactions avec le champ Nom", () => {
        testData.eventNames.forEach((eventName, index) => {
            it(`devrait mettre à jour le nom avec: "${eventName}"`, () => {
                // Arrange - Préparer le composant
                let tree: any;
                act(() => {
                    tree = renderer.create(<CreateEventScreen />);
                });
                const root = tree.root;
                const nomInput = root.findAllByType(TextInput)[0];

                // Act - Modifier le nom
                act(() => {
                    nomInput.props.onChangeText(eventName);
                });

                // Assert - Vérifier la valeur
                const updatedInput = tree.root.findAllByType(TextInput)[0];
                expect(updatedInput.props.value).toBe(eventName);
            });
        });
    });

    describe("Interactions avec le champ Description", () => {
        testData.descriptions.forEach((desc, index) => {
            it(`devrait mettre à jour la description avec: "${desc}"`, () => {
                // Arrange - Préparer le composant
                let tree: any;
                act(() => {
                    tree = renderer.create(<CreateEventScreen />);
                });
                const root = tree.root;
                const descInput = root.findAllByType(TextInput)[1];

                // Act - Modifier la description
                act(() => {
                    descInput.props.onChangeText(desc);
                });

                // Assert - Vérifier la valeur
                const updatedInput = tree.root.findAllByType(TextInput)[1];
                expect(updatedInput.props.value).toBe(desc);
            });
        });

        it("devrait supporter le multiline pour la description", () => {
            // Arrange - Préparer le composant
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });

            // Act - Vérifier la propriété multiline
            const root = tree.root;
            const descInput = root.findAllByType(TextInput)[1];
            const isMultiline = descInput.props.multiline;

            // Assert - Confirmer que multiline est activé
            expect(isMultiline).toBe(true);
        });
    });

    describe("Interactions avec le DatePicker", () => {
        it("devrait afficher le DatePicker au clic sur le champ date", () => {
            // Arrange - Préparer le composant
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;
            const touchables = root.findAllByType(TouchableOpacity);
            const dateButton = touchables.find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) =>
                    text.props.children === new Date().toLocaleDateString("fr-FR")
                );
            });

            // Act - Cliquer sur le bouton de date
            act(() => {
                dateButton.props.onPress();
            });

            // Assert - Vérifier la présence du DatePicker
            const datePickers = tree.root.findAllByType("DateTimePicker" as any);
            expect(datePickers.length).toBeGreaterThan(0);
        });

        testData.dates.forEach((date, index) => {
            it(`devrait mettre à jour la date avec: ${date.toLocaleDateString("fr-FR")}`, () => {
                // Arrange - Préparer le composant
                let tree: any;
                act(() => {
                    tree = renderer.create(<CreateEventScreen />);
                });
                const root = tree.root;
                const touchables = root.findAllByType(TouchableOpacity);
                const dateButton = touchables.find((t: any) => {
                    const texts = t.findAllByType(Text);
                    return texts.some((text: any) =>
                        text.props.children === new Date().toLocaleDateString("fr-FR")
                    );
                });

                act(() => {
                    dateButton.props.onPress();
                });

                // Act - Modifier la date
                const datePicker = tree.root.findByType("DateTimePicker" as any);
                act(() => {
                    datePicker.props.onChange({ type: "set" }, date);
                });

                // Assert - Vérifier la nouvelle date affichée
                const texts = tree.root.findAllByType(Text);
                const textContents = texts.map((t: any) => t.props.children);
                expect(textContents).toContain(date.toLocaleDateString("fr-FR"));
            });
        });

        it("devrait fermer le DatePicker sans changer la date si annulé", () => {
            // Arrange - Préparer le composant
            const initialDate = new Date();
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;
            const touchables = root.findAllByType(TouchableOpacity);
            const dateButton = touchables.find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) =>
                    text.props.children === initialDate.toLocaleDateString("fr-FR")
                );
            });

            act(() => {
                dateButton.props.onPress();
            });

            // Act - Annuler la sélection de date
            const datePicker = tree.root.findByType("DateTimePicker" as any);
            act(() => {
                datePicker.props.onChange({ type: "dismissed" }, undefined);
            });

            // Assert - Vérifier que la date n'a pas changé
            const texts = tree.root.findAllByType(Text);
            const textContents = texts.map((t: any) => t.props.children);
            expect(textContents).toContain(initialDate.toLocaleDateString("fr-FR"));

            const datePickers = tree.root.findAllByType("DateTimePicker" as any);
            expect(datePickers.length).toBe(0);
        });
    });

    describe("Navigation", () => {
        it("devrait revenir en arrière au clic sur la flèche retour", () => {
            // Arrange - Préparer le composant
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;

            // Act - Cliquer sur le bouton retour (premier TouchableOpacity)
            const touchables = root.findAllByType(TouchableOpacity);
            act(() => {
                touchables[0].props.onPress();
            });

            // Assert - Vérifier l'appel de goBack
            expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
        });
    });

    describe("Soumission du formulaire", () => {
        it("devrait insérer un événement avec toutes les données remplies", async () => {
            // Arrange - Préparer le composant avec des données
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;
            const inputs = root.findAllByType(TextInput);

            act(() => {
                inputs[0].props.onChangeText(testData.eventNames[0]);
                inputs[1].props.onChangeText(testData.descriptions[0]);
            });

            // Act - Soumettre le formulaire
            const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) => text.props.children === "Valider");
            });

            await act(async () => {
                await submitButton.props.onPress();
            });

            // Assert - Vérifier l'insertion en base de données
            expect(mockInsert).toHaveBeenCalledTimes(1);
            expect(mockInsert).toHaveBeenCalledWith(
                mockDb,
                "Evenement",
                expect.objectContaining({
                    UUID: testData.uuids[0],
                    Nom: testData.eventNames[0],
                    Description: testData.descriptions[0],
                    Status: "A_ORGANISER",
                })
            );
        });

        it("devrait insérer un événement avec des champs vides", async () => {
            // Arrange - Préparer le composant sans données
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;

            // Act - Soumettre le formulaire vide
            const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) => text.props.children === "Valider");
            });

            await act(async () => {
                await submitButton.props.onPress();
            });

            // Assert - Vérifier l'insertion avec des champs vides
            expect(mockInsert).toHaveBeenCalledWith(
                mockDb,
                "Evenement",
                expect.objectContaining({
                    Nom: "",
                    Description: "",
                })
            );
        });

        it("devrait naviguer en arrière après soumission réussie", async () => {
            // Arrange - Préparer le composant
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;

            // Act - Soumettre le formulaire
            const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) => text.props.children === "Valider");
            });

            await act(async () => {
                await submitButton.props.onPress();
            });

            // Assert - Vérifier la navigation
            expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
        });

        it("devrait gérer les erreurs d'insertion en base de données", async () => {
            // Arrange - Préparer le mock pour échouer
            const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
            const error = new Error("Erreur d'insertion");
            mockInsert.mockRejectedValueOnce(error);

            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;

            // Act - Soumettre le formulaire
            const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) => text.props.children === "Valider");
            });

            await act(async () => {
                await submitButton.props.onPress();
            });

            // Assert - Vérifier que l'erreur est loggée
            expect(consoleLogSpy).toHaveBeenCalledWith(error);
            consoleLogSpy.mockRestore();
        });


        testData.eventNames.slice(0, 3).forEach((nom, index) => {
            it(`devrait créer un événement avec le nom: "${nom}"`, async () => {
                // Arrange - Préparer les données de test
                (uuid.v4 as jest.Mock).mockReturnValue(testData.uuids[index]);

                let tree: any;
                act(() => {
                    tree = renderer.create(<CreateEventScreen />);
                });
                const root = tree.root;
                const inputs = root.findAllByType(TextInput);

                act(() => {
                    inputs[0].props.onChangeText(nom);
                    inputs[1].props.onChangeText(testData.descriptions[index]);
                });

                // Act - Soumettre le formulaire
                const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                    const texts = t.findAllByType(Text);
                    return texts.some((text: any) => text.props.children === "Valider");
                });

                await act(async () => {
                    await submitButton.props.onPress();
                });

                // Assert - Vérifier l'insertion avec les bonnes données
                expect(mockInsert).toHaveBeenCalledWith(
                    mockDb,
                    "Evenement",
                    expect.objectContaining({
                        UUID: testData.uuids[index],
                        Nom: nom,
                        Description: testData.descriptions[index],
                    })
                );
            });
        });

        it("devrait utiliser le format ISO pour la date en base de données", async () => {
            // Arrange - Préparer le composant
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;

            // Act - Soumettre le formulaire
            const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) => text.props.children === "Valider");
            });

            await act(async () => {
                await submitButton.props.onPress();
            });

            // Assert - Vérifier le format de la date
            expect(mockInsert).toHaveBeenCalledWith(
                mockDb,
                "Evenement",
                expect.objectContaining({
                    Date_debut: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
                })
            );
        });

        it("devrait toujours créer un événement avec le statut A_ORGANISER", async () => {
            // Arrange - Préparer le composant
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;

            // Act - Soumettre le formulaire
            const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) => text.props.children === "Valider");
            });

            await act(async () => {
                await submitButton.props.onPress();
            });

            // Assert - Vérifier le statut
            expect(mockInsert).toHaveBeenCalledWith(
                mockDb,
                "Evenement",
                expect.objectContaining({
                    Status: "A_ORGANISER",
                })
            );
        });
    });

    describe("Intégration complète", () => {
        it("devrait permettre de remplir tout le formulaire et soumettre", async () => {
            // Arrange - Préparer le composant
            let tree: any;
            act(() => {
                tree = renderer.create(<CreateEventScreen />);
            });
            const root = tree.root;
            const inputs = root.findAllByType(TextInput);

            // Act - Remplir tous les champs
            act(() => {
                inputs[0].props.onChangeText(testData.eventNames[2]);
                inputs[1].props.onChangeText(testData.descriptions[3]);
            });

            const touchables = root.findAllByType(TouchableOpacity);
            const dateButton = touchables.find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) =>
                    text.props.children === new Date().toLocaleDateString("fr-FR")
                );
            });

            act(() => {
                dateButton.props.onPress();
            });

            const datePicker = tree.root.findByType("DateTimePicker" as any);
            act(() => {
                datePicker.props.onChange({ type: "set" }, testData.dates[1]);
            });

            const submitButton = root.findAllByType(TouchableOpacity).find((t: any) => {
                const texts = t.findAllByType(Text);
                return texts.some((text: any) => text.props.children === "Valider");
            });

            await act(async () => {
                await submitButton.props.onPress();
            });

            // Assert - Vérifier que tout a été appelé correctement
            expect(mockInsert).toHaveBeenCalledTimes(1);
            expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
        });
    });
});
