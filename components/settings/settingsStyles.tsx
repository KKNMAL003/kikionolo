import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    padding: 4,
  },
  sectionTitle: {
    color: colors.text.gray,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    color: colors.text.gray,
    fontSize: 13,
    marginTop: 2,
  },
  settingArrow: {
    marginLeft: 'auto',
  },
});
